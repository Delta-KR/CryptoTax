# 환경변수 (Environment Variables)

kontaxt 앱이 사용하는 환경변수 list. Vercel 대시보드 > Project > Settings > Environment
Variables에 등록.

## Supabase

| 키 | 용도 | scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 모든 환경 (public OK) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon JWT (RLS 통과) | 모든 환경 (public OK) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role JWT (RLS bypass) | server only — **절대 client 노출 금지** |

## 사이트

| 키 | 용도 | 기본값 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | OAuth callback, OG URL, CORS | (없으면 `VERCEL_URL` → `http://localhost:3000`) |

## Rate limit (P4-R1, 2026-05-22 추가)

Upstash Redis 기반 슬라이딩 윈도우 rate limit. `lib/rate-limit.ts`에서 사용.

| 키 | 용도 |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

### 세팅 방법

1. https://console.upstash.com → Create Database → Region: AP-Northeast-1 (Tokyo) 또는
   가까운 region 선택 → Free tier 10K commands/day.
2. Database 페이지의 **REST API** 섹션에서 `UPSTASH_REDIS_REST_URL` +
   `UPSTASH_REDIS_REST_TOKEN` 복사.
3. Vercel 대시보드 > Environment Variables에 둘 다 추가 (Production / Preview / Development
   모두).
4. 로컬 dev에서도 사용하려면 `.env.local`에 동일하게 추가.

### Limit 설정

| 라우트 | 키 | 윈도우 | 식별자 |
|---|---|---|---|
| `/api/report` (PDF 다운로드) | `kontaxt-report` | 10 req / 1 min | IP (x-forwarded-for) |
| `calculateTaxFromFiles` (server action) | `kontaxt-calculate` | 20 req / 1 min | `user:${user.id}` 또는 `ip:${ip}` |

미설정 시 fail-closed (모든 요청 차단). 운영 시 prod에는 반드시 설정 필요.

## 결제 (Phase 7, 미구현)

Toss Payments 통합 시 추가될 env vars (현재는 미사용):

| 키 | 용도 |
|---|---|
| `TOSS_SECRET_KEY` | 결제 승인 API 호출 |
| `TOSS_WEBHOOK_SECRET` | webhook 서명 검증 |
