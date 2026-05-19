-- 2026-12-31 도래 시 daily_rates의 종가를 deemed_cost_snapshots에 'real'로 승격.
-- user_override는 건드리지 않음 (사용자 수동 입력 보호).
-- 호출: select public.promote_deemed_cost_from_daily_rates();
create or replace function public.promote_deemed_cost_from_daily_rates(
  deemed_date_param date default '2026-12-31'
)
returns table (
  promoted_count integer,
  skipped_user_override integer,
  no_data_for_date integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  promoted integer := 0;
  skipped integer := 0;
  no_data integer := 0;
begin
  -- 해당 일자에 시세가 있는지 확인
  if not exists (
    select 1 from public.daily_rates
    where date = deemed_date_param and to_currency = 'KRW'
  ) then
    no_data := 1;
    return query select promoted, skipped, no_data;
    return;
  end if;

  -- user_override 카운트 (건드리지 않을 행)
  select count(*) into skipped
  from public.deemed_cost_snapshots
  where source_type = 'user_override';

  -- daily_rates 종가로 upsert (단, user_override 제외)
  with src as (
    select
      from_currency as coin,
      deemed_date_param as deemed_date,
      rate as price_krw,
      source as src_label
    from public.daily_rates
    where date = deemed_date_param and to_currency = 'KRW'
  )
  insert into public.deemed_cost_snapshots (coin, deemed_date, price_krw, source, source_type)
  select coin, deemed_date, price_krw,
    src_label || ' (' || deemed_date::text || ')', 'real'
  from src
  on conflict (coin) do update
    set price_krw = excluded.price_krw,
        source = excluded.source,
        source_type = excluded.source_type,
        deemed_date = excluded.deemed_date
    where deemed_cost_snapshots.source_type <> 'user_override';

  get diagnostics promoted = row_count;
  return query select promoted, skipped, no_data;
end;
$$;

comment on function public.promote_deemed_cost_from_daily_rates is
  '의제취득가액 시가 승격: daily_rates의 종가를 deemed_cost_snapshots에 source_type=real로 승격. user_override는 보존. 2026-12-31 이후 호출.';
