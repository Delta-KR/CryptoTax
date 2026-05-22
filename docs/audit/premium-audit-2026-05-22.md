# Premium 사용자 부정 승급 audit — 2026-05-22

## 배경

`app/actions/upgrade-plan.ts` 차단 이전 (commit `bcdf0e8` / 2026-05-13 이전)에는
결제 검증 없이 server action 직접 호출만으로 `plan='premium'` UPDATE가 가능했다.
또한 동일 시기에 anon role에 `profiles.UPDATE` GRANT가 살아 있어 클라이언트에서도
`supabase.from('profiles').update({plan:'premium'}).eq('id', user.id)`로 직접
승급할 수 있는 상태였음 (P1-C, 같은 PR에서 사용자 액션으로 GRANT 회수 요청).

→ 결과: 2026-05-13 이전에 가입한 premium 사용자 중 결제 의사 없이 자가 승급한 케이스가
존재할 수 있음. 이 문서는 그 audit 절차와 실행 SQL을 정리한다.

## 위협 모델

- 공격면: `upgradePlan()` server action 호출, 또는 anon JWT로 `profiles.UPDATE` 직접 호출.
- 영향: PDF 리포트 다운로드, 마스킹 해제(taxableIncomeKRW / 실현손익 등) 무단 이용.
- 차단 시점:
  - server action: 2026-05-13 (`bcdf0e8`) — `upgradePlan/downgradePlan` 본문을
    `{ ok: false, error: '결제 시스템 준비 중' }`로 강제 교체.
  - anon UPDATE GRANT: 같은 PR에서 사용자 수동 액션 (`revoke update, delete on
    public.profiles from anon, authenticated`).
- Audit 대상 기간: 2026-05-13 이전 `created_at` 또는 `updated_at`이 그 사이에 있는
  premium 사용자 전수.

## 실행 SQL (Supabase Studio → SQL Editor)

```sql
-- 1) 현재 premium 사용자 전체 list
select
  id,
  email,
  plan,
  premium_until,
  created_at,
  updated_at
from public.profiles
where plan = 'premium'
order by created_at asc;

-- 2) 2026-05-13 차단 이전에 마지막 변경된 premium 사용자 (우선 audit 대상)
select
  id,
  email,
  plan,
  premium_until,
  created_at,
  updated_at
from public.profiles
where plan = 'premium'
  and (updated_at < '2026-05-13'::timestamptz or updated_at is null)
order by updated_at asc nulls first;

-- 3) Auth 메타데이터 cross-check (가입 경로 / provider / 마지막 로그인)
select
  p.id,
  p.email,
  p.plan,
  p.created_at as profile_created,
  u.created_at as auth_created,
  u.last_sign_in_at,
  u.raw_app_meta_data->>'provider' as auth_provider
from public.profiles p
left join auth.users u on u.id = p.id
where p.plan = 'premium'
order by p.created_at asc;
```

## 결제 이력 cross-check

현재 결제 통합(Toss Payments, Phase 7)이 미구현 상태이므로, **정당한 경로로 결제한
premium 사용자는 존재할 수 없다.** 즉 모든 premium 행은 다음 중 하나:

1. 운영자(본인) 수동 부여 — Supabase Studio에서 직접 UPDATE한 케이스. 본인 계정 + 알려진
   beta 테스터 계정만 정당.
2. 부정 승급 — 2026-05-13 이전 server action 또는 anon UPDATE 경로로 자가 부여.

## 절차

1. **차단 시점 재확인** — `git log app/actions/upgrade-plan.ts`로 commit `bcdf0e8`
   (2026-05-13) 확인. anon UPDATE GRANT 회수는 별도 사용자 액션이었으므로 Supabase
   audit log에서 GRANT 회수 시점 확인 권장.
2. **현재 premium list 추출** — 위 (1) SQL 실행 결과를 CSV로 export.
3. **운영자 화이트리스트와 대조** — 본인 계정 UUID + 의도적으로 부여한 베타 테스터
   UUID list를 별도 관리 (예: `docs/audit/premium-whitelist.md` — 본 PR에서는 신설
   안 함, 운영자 본인이 별도 관리).
4. **화이트리스트 외 사용자 식별** — auth provider, 마지막 로그인, 사용 흔적 (profiles
   외 다른 테이블 활동) 확인 후 운영자가 정당성 판단.
5. **부정 승급 발견 시 조치**:
   ```sql
   -- 부정 승급 행 down-grade
   update public.profiles
   set plan = 'free',
       premium_until = null,
       updated_at = now()
   where id in ('<uuid1>', '<uuid2>', ...);
   ```
   - 이메일로 안내: "결제 검증 미구현 시기에 비정상 경로로 premium이 부여되어 무료로
     환원했습니다. 결제 통합 후 정식 구매 가능."

## 결제 통합 (Toss) 후 영구 방지책

본 audit가 일회성으로 끝나려면 다음이 필요하다:

1. **`profile_audit` 테이블 신설** — `plan` 변경 시 자동 트리거로 audit row 적재.
   ```sql
   create table public.profile_audit (
     id          uuid primary key default gen_random_uuid(),
     profile_id  uuid not null references public.profiles(id) on delete cascade,
     old_plan    text,
     new_plan    text,
     changed_by  uuid,          -- auth.uid() (운영자 또는 system)
     reason      text,          -- 'toss_webhook' | 'manual_admin' | 'auto_expire' etc.
     metadata    jsonb,         -- toss orderId, paymentKey 등
     created_at  timestamptz default now()
   );
   alter table public.profile_audit enable row level security;
   -- service_role only — RLS policy 없음 = 일반 사용자 read 불가.
   ```

2. **`plan` 컬럼 UPDATE를 webhook + service_role로만 제한**:
   - anon / authenticated GRANT 영구 회수 (이미 완료).
   - SECURITY DEFINER 함수로만 `plan` UPDATE 허용. 함수 내부에서 Toss 영수증 검증 후
     커밋 + profile_audit 동시 insert.

3. **만료 cron** — `premium_until < now()`인 행을 매일 free로 환원. 동시에 audit row
   적재 (`reason = 'auto_expire'`).

## 참고

- 차단 commit: `bcdf0e8` (2026-05-13 — "security(P1): open redirect 방어 + mock 결제 차단")
- 차단 코드: `app/actions/upgrade-plan.ts` (현재 두 함수 모두 즉시 `{ ok: false }` 반환)
- PIPA: 부정 승급 사용자에게 알림은 사실 통지일 뿐 별도 동의 불필요. 다만 변경 사실은
  `updated_at`에 자동 기록되므로 추후 분쟁 시 audit 가능.
