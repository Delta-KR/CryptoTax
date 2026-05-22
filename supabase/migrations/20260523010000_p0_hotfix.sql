-- P0 hotfix: 머지 차단급 4건 일괄 수정.
--
-- Fix 1 (C1): user_deemed_cost_overrides.update policy에 WITH CHECK 누락.
--   USING만 있으면 UPDATE 시 다른 user_id로 변경 가능 → 본인 row를 타 사용자에게 이전하는 권한 우회 가능.
--   drop + recreate with `with check (auth.uid() = user_id)`로 in-place 위/변조 방지.
--
-- Fix 2 (C7): deemed_cost_snapshots.coin PK → (coin, deemed_date) 복합 PK.
--   현재 PK가 coin 단일이라 동일 코인의 여러 deemed_date를 보존 불가.
--   (예: 2026-12-31 estimate → real 승격 시 과거 estimate 이력 상실).
--   기존 행은 보존하면서 PK만 교체.
--
-- Fix 3 (Ultra-14): user_imputed_expense_coins에 UPDATE policy 부재.
--   saveImputedExpenseCoin이 .upsert(onConflict)을 사용 → ON CONFLICT DO UPDATE 분기에서
--   UPDATE policy 미존재 시 RLS 차단으로 실패. SELECT/INSERT/DELETE와 동일 권한으로 UPDATE 허용.
--
-- Fix 4 (P4-S1): 트리거 함수 3개에 search_path 명시 (Supabase Advisor WARN 해소).
--   search_path 미설정 함수는 search_path 하이재킹 공격 가능 → `public, pg_temp` 고정.

-- ============================================================================
-- Fix 1: user_deemed_cost_overrides UPDATE policy에 WITH CHECK 추가
-- ============================================================================
drop policy if exists "user_deemed_cost_overrides_update_own"
  on public.user_deemed_cost_overrides;

create policy "user_deemed_cost_overrides_update_own"
  on public.user_deemed_cost_overrides for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Fix 2: deemed_cost_snapshots PK → (coin, deemed_date)
-- ============================================================================
alter table public.deemed_cost_snapshots
  drop constraint if exists deemed_cost_snapshots_pkey;

alter table public.deemed_cost_snapshots
  add primary key (coin, deemed_date);

-- ============================================================================
-- Fix 3: user_imputed_expense_coins UPDATE policy 추가
-- ============================================================================
drop policy if exists "user_imputed_expense_coins_update_own"
  on public.user_imputed_expense_coins;

create policy "user_imputed_expense_coins_update_own"
  on public.user_imputed_expense_coins for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- Fix 4: 트리거 함수 3개 search_path 고정
-- ============================================================================
alter function public.update_daily_rates_fetched_at()
  set search_path = public, pg_temp;

alter function public.update_deemed_cost_fetched_at()
  set search_path = public, pg_temp;

alter function public.update_user_deemed_cost_overrides_updated_at()
  set search_path = public, pg_temp;

-- ============================================================================
-- 검증 쿼리 (수동 실행용):
-- select * from pg_policies where tablename = 'user_imputed_expense_coins';
--   -- 4 rows 기대 (SELECT, INSERT, UPDATE, DELETE)
-- select policyname, cmd, qual, with_check
--   from pg_policies
--   where tablename = 'user_deemed_cost_overrides' and cmd = 'UPDATE';
--   -- with_check가 'auth.uid() = user_id'로 채워져 있어야 함
-- select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.deemed_cost_snapshots'::regclass and contype = 'p';
--   -- PRIMARY KEY (coin, deemed_date)
-- select proname, proconfig
--   from pg_proc
--   where proname in (
--     'update_daily_rates_fetched_at',
--     'update_deemed_cost_fetched_at',
--     'update_user_deemed_cost_overrides_updated_at'
--   );
--   -- proconfig에 {search_path=public, pg_temp} 포함
-- ============================================================================
