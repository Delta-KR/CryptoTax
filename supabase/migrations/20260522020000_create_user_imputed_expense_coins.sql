-- 사용자별 필요경비 의제 50% 적용 코인.
-- 시행령 §88④⑤ (2025-02-28 신설, 시행 2027-01-01):
--   ④ "대통령령으로 정하는 사유" (취득가액 확인 곤란):
--      1. 가상자산사업자를 통하지 않고 취득 + 장부/증명서류로 확인 불가
--      2. 그 밖에 국세청장이 정하여 고시하는 사유
--   ⑤ "대통령령으로 정하는 비율": 100분의 50
--
-- 적용 단위: "동종 가상자산 전체에 적용" — 코인 단위 통째.
-- 적용 코인의 모든 매도는 매도가액의 50%가 필요경비로 의제. 별도 부대비용 인정 안 함.
-- 시가 의제(§37⑤)·평균단가(§88①)는 모두 무시 (의제 모드 우선).
create table if not exists public.user_imputed_expense_coins (
  user_id uuid not null references auth.users(id) on delete cascade,
  coin text not null check (length(coin) between 1 and 16),
  applied_at timestamptz not null default now(),
  primary key (user_id, coin)
);

create index if not exists idx_user_imputed_expense_coins_user
  on public.user_imputed_expense_coins (user_id);

-- RLS: 본인 row만 모든 작업 가능. update는 별도 필요 없음 (켰다 끄는 토글 모델).
alter table public.user_imputed_expense_coins enable row level security;

create policy "user_imputed_expense_coins_select_own"
  on public.user_imputed_expense_coins for select
  using (auth.uid() = user_id);

create policy "user_imputed_expense_coins_insert_own"
  on public.user_imputed_expense_coins for insert
  with check (auth.uid() = user_id);

create policy "user_imputed_expense_coins_delete_own"
  on public.user_imputed_expense_coins for delete
  using (auth.uid() = user_id);

comment on table public.user_imputed_expense_coins is
  '사용자별 필요경비 의제 50% 적용 코인. 시행령 §88④⑤. 적용 시 그 코인 전체 매도가액의 50%를 필요경비로 의제 (부대비용 불인정, 시가 의제·평균단가 무시).';
