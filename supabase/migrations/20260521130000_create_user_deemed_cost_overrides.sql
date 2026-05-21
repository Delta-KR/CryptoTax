-- 사용자별 의제취득가액 수동 입력 저장소.
-- 글로벌 deemed_cost_snapshots는 시스템이 자동 적재(real/estimate)하는 공유 데이터.
-- user_deemed_cost_overrides는 사용자가 직접 입력한 값으로, 본인에게만 적용됨.
-- 엔진은 user override 우선 → fallback으로 글로벌 deemed_cost_snapshots 조회.
create table if not exists public.user_deemed_cost_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  coin text not null check (length(coin) between 1 and 16),
  deemed_date date not null default '2026-12-31',
  price_krw numeric(20, 8) not null check (price_krw > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, coin, deemed_date)
);

create index if not exists idx_user_deemed_cost_overrides_user
  on public.user_deemed_cost_overrides (user_id);

-- RLS: 본인 row만 모든 작업 가능.
alter table public.user_deemed_cost_overrides enable row level security;

create policy "user_deemed_cost_overrides_select_own"
  on public.user_deemed_cost_overrides for select
  using (auth.uid() = user_id);

create policy "user_deemed_cost_overrides_insert_own"
  on public.user_deemed_cost_overrides for insert
  with check (auth.uid() = user_id);

create policy "user_deemed_cost_overrides_update_own"
  on public.user_deemed_cost_overrides for update
  using (auth.uid() = user_id);

create policy "user_deemed_cost_overrides_delete_own"
  on public.user_deemed_cost_overrides for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거.
create or replace function public.update_user_deemed_cost_overrides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_user_deemed_cost_overrides_updated_at
  before update on public.user_deemed_cost_overrides
  for each row
  execute function public.update_user_deemed_cost_overrides_updated_at();

comment on table public.user_deemed_cost_overrides is
  '사용자별 의제취득가액 수동 입력. 엔진은 이 테이블 우선 조회 → 없으면 글로벌 deemed_cost_snapshots fallback.';
