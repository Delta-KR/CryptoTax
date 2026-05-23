-- Supabase advisor (performance) 가 가리킨 auth_rls_initplan 10건 일괄 수정.
-- RLS 정책 안에서 auth.uid() 를 그대로 부르면 row 단위로 재평가되어
-- 스케일 시 비용이 커진다. (select auth.uid()) 로 감싸 1회만 평가되도록 변경.
-- 보안 효과 동일, 성능만 개선.
--
-- 중요: UPDATE 정책에는 USING 뿐 아니라 WITH CHECK 도 반드시 포함시켜 user_id 변조
-- (C1 회귀) 를 막아야 한다. 2026-05-23 P0 hotfix 에서 추가된 보호이며 본 정책
-- 재생성 시 누락되지 않도록 명시.
--
-- 같이 처리: deemed_cost_snapshots 의 unused index idx_deemed_cost_source_type
-- 드롭 — 테이블 row 수가 적어 sequential scan 이 더 빠르며, advisor 가 사용
-- 흔적 없음으로 분류.

-- ──────────── user_deemed_cost_overrides ────────────
drop policy if exists "user_deemed_cost_overrides_select_own"
  on public.user_deemed_cost_overrides;
drop policy if exists "user_deemed_cost_overrides_insert_own"
  on public.user_deemed_cost_overrides;
drop policy if exists "user_deemed_cost_overrides_update_own"
  on public.user_deemed_cost_overrides;
drop policy if exists "user_deemed_cost_overrides_delete_own"
  on public.user_deemed_cost_overrides;

create policy "user_deemed_cost_overrides_select_own"
  on public.user_deemed_cost_overrides for select
  using ((select auth.uid()) = user_id);

create policy "user_deemed_cost_overrides_insert_own"
  on public.user_deemed_cost_overrides for insert
  with check ((select auth.uid()) = user_id);

create policy "user_deemed_cost_overrides_update_own"
  on public.user_deemed_cost_overrides for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_deemed_cost_overrides_delete_own"
  on public.user_deemed_cost_overrides for delete
  using ((select auth.uid()) = user_id);

-- ──────────── user_imputed_expense_coins ────────────
drop policy if exists "user_imputed_expense_coins_select_own"
  on public.user_imputed_expense_coins;
drop policy if exists "user_imputed_expense_coins_insert_own"
  on public.user_imputed_expense_coins;
drop policy if exists "user_imputed_expense_coins_delete_own"
  on public.user_imputed_expense_coins;

create policy "user_imputed_expense_coins_select_own"
  on public.user_imputed_expense_coins for select
  using ((select auth.uid()) = user_id);

create policy "user_imputed_expense_coins_insert_own"
  on public.user_imputed_expense_coins for insert
  with check ((select auth.uid()) = user_id);

create policy "user_imputed_expense_coins_delete_own"
  on public.user_imputed_expense_coins for delete
  using ((select auth.uid()) = user_id);

-- ──────────── user_data ────────────
drop policy if exists user_data_select_own on public.user_data;
drop policy if exists user_data_insert_own on public.user_data;
drop policy if exists user_data_update_own on public.user_data;

create policy user_data_select_own on public.user_data
  for select
  using ((select auth.uid()) = user_id);

create policy user_data_insert_own on public.user_data
  for insert
  with check ((select auth.uid()) = user_id);

-- UPDATE: WITH CHECK 도 함께 — user_id 컬럼 변조 차단 (C1 regression 방지).
create policy user_data_update_own on public.user_data
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ──────────── unused index drop ────────────
drop index if exists public.idx_deemed_cost_source_type;
