-- 일별 환율/시세 데이터. Upbit KRW 마켓 종가 + 향후 ECOS USD/KRW 등.
-- 양도소득세 계산에서 외화·암호화폐 → KRW 환산 시 조회.
create table if not exists public.daily_rates (
  id bigint generated always as identity primary key,
  date date not null,
  from_currency text not null check (length(from_currency) between 1 and 16),
  to_currency text not null check (length(to_currency) between 1 and 16),
  rate numeric(20, 8) not null check (rate > 0),
  source text not null,
  fetched_at timestamptz not null default now(),
  unique (date, from_currency, to_currency)
);

-- 빈번한 조회 패턴: (from, to, date)로 시세 lookup
create index if not exists idx_daily_rates_lookup
  on public.daily_rates (from_currency, to_currency, date desc);

-- 시계열 쿼리 (특정 기간 일괄 preload)
create index if not exists idx_daily_rates_date
  on public.daily_rates (date desc);

-- RLS: 시세는 공개 데이터 → 누구나 read. 쓰기는 service_role만 (Edge function).
alter table public.daily_rates enable row level security;

create policy "daily_rates_read_all"
  on public.daily_rates for select
  using (true);

-- 자동 갱신 timestamp 트리거
create or replace function public.update_daily_rates_fetched_at()
returns trigger
language plpgsql
as $$
begin
  new.fetched_at := now();
  return new;
end;
$$;

create trigger trg_daily_rates_fetched_at
  before update on public.daily_rates
  for each row
  execute function public.update_daily_rates_fetched_at();

comment on table public.daily_rates is
  '일별 환율/시세. from_currency → to_currency 비율 (예: BTC → KRW = 80000000). source: 출처 식별자 (Upbit, ECOS 등).';
