-- 의제취득가액 시가 (한국 세법: 2026-12-31 시가).
-- pre-2027 매수 lot의 cost basis는 max(실가, snapshot)으로 적용.
-- 코인당 1행 (deemed_date 기준).
create table if not exists public.deemed_cost_snapshots (
  coin text primary key check (length(coin) between 1 and 16),
  deemed_date date not null default '2026-12-31',
  price_krw numeric(20, 8) not null check (price_krw > 0),
  source text not null,
  -- 'real': 실제 2026-12-31 종가 / 'estimate': 추정치 (사전 미확정 기간) / 'user_override': 사용자 수동 입력
  source_type text not null check (source_type in ('real', 'estimate', 'user_override')),
  fetched_at timestamptz not null default now()
);

create index if not exists idx_deemed_cost_source_type
  on public.deemed_cost_snapshots (source_type);

alter table public.deemed_cost_snapshots enable row level security;

create policy "deemed_cost_read_all"
  on public.deemed_cost_snapshots for select
  using (true);

comment on table public.deemed_cost_snapshots is
  '한국 세법 의제취득가액 (2026-12-31 시가). pre-2027 매수의 cost basis 산정 시 max(실가, snapshot) 적용. source_type=real은 2026-12-31 도래 후 실데이터, estimate는 그 전 추정치, user_override는 사용자 수동 입력.';

-- 자동 갱신 timestamp
create or replace function public.update_deemed_cost_fetched_at()
returns trigger
language plpgsql
as $$
begin
  new.fetched_at := now();
  return new;
end;
$$;

create trigger trg_deemed_cost_fetched_at
  before update on public.deemed_cost_snapshots
  for each row
  execute function public.update_deemed_cost_fetched_at();

-- 초기 시드: 2026-05-19 기준 추정치. 2026-12-31 도래 후 promote_deemed_cost_from_daily_rates()로 'real' 승격.
insert into public.deemed_cost_snapshots (coin, price_krw, source, source_type)
values
  ('USDT', 1500, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('USDC', 1500, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('BTC', 150000000, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('ETH', 5000000, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('SOL', 300000, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('XRP', 800, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('DUSK', 5, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('GOAT', 800, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('ETC', 30000, 'Hardcoded estimate (2026-05-19)', 'estimate'),
  ('1000FLOKI', 200, 'Hardcoded estimate (2026-05-19)', 'estimate')
on conflict (coin) do nothing;
