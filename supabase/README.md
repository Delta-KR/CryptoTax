# Supabase 인프라

kontaxt의 Supabase 자산 (마이그레이션 + Edge function). DB schema와 환율 fetcher가 여기 저장됨.

## 디렉토리 구조

```
supabase/
├── migrations/                              # SQL 마이그레이션 (시간순 적용)
│   ├── 20260519100000_create_daily_rates.sql
│   ├── 20260519100100_enable_pg_net.sql
│   ├── 20260519110000_create_deemed_cost_snapshots.sql
│   └── 20260519110100_create_promote_deemed_cost_function.sql
├── functions/
│   └── fetch-daily-rates/
│       └── index.ts                         # Upbit KRW 마켓 종가 fetcher
└── README.md
```

## 마이그레이션

### `20260519100000_create_daily_rates.sql`
일별 환율/시세 테이블. `daily_rates(date, from_currency, to_currency, rate, source, fetched_at)`. RLS 공개 read.

### `20260519100100_enable_pg_net.sql`
pg_net 확장 활성화. Postgres에서 async HTTP — Edge function 트리거용.

### `20260519110000_create_deemed_cost_snapshots.sql`
의제취득가액 시가 테이블 (한국 세법, 2026-12-31 기준). 10개 코인 추정치 시드.

### `20260519110100_create_promote_deemed_cost_function.sql`
SQL 함수 `promote_deemed_cost_from_daily_rates(deemed_date)`. 2026-12-31 도래 시 `daily_rates` 종가를 `deemed_cost_snapshots`에 source_type='real'로 자동 승격. `user_override` 보존.

## Edge function

### `fetch-daily-rates`
Upbit `/v1/candles/days` API에서 KRW-{coin} 일별 종가를 paginated fetch → `daily_rates` upsert.

**호출** (x-shared-secret 헤더 필수):
```bash
curl -X POST https://{PROJECT_REF}.supabase.co/functions/v1/fetch-daily-rates \
  -H 'Content-Type: application/json' \
  -H "x-shared-secret: $FETCH_RATES_SHARED_SECRET" \
  -d '{"startDate": "2024-01-01", "coins": ["BTC", "ETH", "USDT", "SOL", "XRP"]}'
```

**또는 SQL (pg_net 사용)** — cron이 자동으로 vault에서 secret 로드 (`20260522030000_cron_shared_secret.sql`):
```sql
select net.http_post(
  url := 'https://{PROJECT_REF}.supabase.co/functions/v1/fetch-daily-rates',
  body := jsonb_build_object(
    'startDate', '2024-01-01',
    'coins', jsonb_build_array('BTC', 'ETH', 'USDT', 'SOL', 'XRP')
  ),
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-shared-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'fetch_rates_shared_secret')
  ),
  timeout_milliseconds := 180000
) as request_id;
```

**환경 변수**:
- `SUPABASE_URL` (자동 주입)
- `SUPABASE_SERVICE_ROLE_KEY` (자동 주입)
- `FETCH_RATES_SHARED_SECRET` — **수동 설정 필수**. Edge function 설정에서 환경변수로 추가하고, 동일 값을 Supabase Vault에 `fetch_rates_shared_secret` 이름으로 저장.

**입력 clamp**:
- `coins`: 1~50개, `/^[A-Z0-9]{1,16}$/` 매칭만 통과
- `startDate`: 2022-01-01 ~ 오늘(UTC) 범위

**보안**:
- `verify_jwt: false`로 배포되지만 shared secret으로 익명 호출 차단.
- v2에서 rate limit 추가 예정.

## 운영 절차

### 새 환경 세팅 (재구축)
```bash
# 1. Supabase CLI로 로컬 → 원격 연결
supabase login
supabase link --project-ref {PROJECT_REF}

# 2. Shared secret 생성 + Vault 저장
export FETCH_RATES_SHARED_SECRET=$(openssl rand -hex 32)
# Supabase Dashboard → Vault에서 'fetch_rates_shared_secret' 이름으로 위 값 저장.

# 3. Edge function 환경변수 등록 + 배포
supabase secrets set FETCH_RATES_SHARED_SECRET="$FETCH_RATES_SHARED_SECRET"
supabase functions deploy fetch-daily-rates --no-verify-jwt

# 4. 마이그레이션 적용 (profiles 포함 — 신규 환경에서 schema drift 해소)
supabase db push

# 5. 초기 시드 (4년치 환율)
curl -X POST https://{PROJECT_REF}.supabase.co/functions/v1/fetch-daily-rates \
  -H 'Content-Type: application/json' \
  -H "x-shared-secret: $FETCH_RATES_SHARED_SECRET" \
  -d '{"startDate": "2024-01-01"}'
```

### 정기 갱신 (cron 자동화 — `20260521120000_setup_daily_rates_cron.sql`)
KST 01:00 자동 실행. 수동 호출 시:
```bash
curl -X POST https://{PROJECT_REF}.supabase.co/functions/v1/fetch-daily-rates \
  -H 'Content-Type: application/json' \
  -H "x-shared-secret: $FETCH_RATES_SHARED_SECRET" \
  -d '{}'
```

### 2026-12-31 도래 시 의제 시가 승격
```sql
-- 1. 2026-12-31까지 daily_rates 적재 (위 curl)

-- 2. real 데이터로 승격
select * from public.promote_deemed_cost_from_daily_rates();
-- 또는 다른 deemed_date 지정:
-- select * from public.promote_deemed_cost_from_daily_rates('2026-12-31'::date);
```

### v2 백로그
- Edge function body 시크릿 인증 + rate limit
- 매일 자동 fetch cron (pg_cron 또는 Vercel cron)
- ECOS USD/KRW 통합 (Upbit 미상장 통화)
- 사용자 수동 의제 시가 입력 UI (Settings, Premium)
- CoinGecko fallback (Upbit 미상장 알트)
