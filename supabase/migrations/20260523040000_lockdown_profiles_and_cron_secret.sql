-- P0/P1 hardening (logic audit 2026-05-23):
--
-- 1) profiles.plan / profiles.premium_until 셀프 승급 차단을 코드 단위로 명문화.
--    프로젝트엔 이미 anon/authenticated 의 UPDATE GRANT 가 수동 회수돼 있지만,
--    fresh install 이나 마이그레이션 재적용 시점에 회귀 위험이 있음.
--    REVOKE 를 이 마이그레이션에 박아 source-of-truth 화.
--    그리고 service_role 가 아닌 경로에서 plan/premium_until 변경을 trigger 로
--    명시적 거부 — 일관 보호.
--
-- 2) cron.job 본문에 평문으로 박힌 shared_secret 제거. SECURITY DEFINER 함수가
--    호출 시점에 vault 에서 읽어 헤더에 주입 → cron.job 테이블 dump 시 평문 노출 차단.

-- ──────────── 1) profiles 권한 명시 ────────────
-- INSERT 는 handle_new_user 트리거 (SECURITY DEFINER) 가 처리하므로 anon/authenticated
-- 에게 직접 INSERT 줄 필요 없음. SELECT 는 RLS 정책으로만 통제.
-- UPDATE/DELETE 는 service_role 만.

revoke update, delete on public.profiles from anon, authenticated;
revoke insert on public.profiles from anon, authenticated;

-- ──────────── 2) plan/premium_until 변경 가드 (defense-in-depth) ────────────
-- 만약 future grants 가 잘못 부여돼도 trigger 가 막아준다.
create or replace function public.profiles_block_self_promote()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- service_role / postgres role 은 그대로 통과.
  if (current_setting('role', true) in ('service_role', 'postgres')) then
    return new;
  end if;
  -- 그 외 role 은 plan/premium_until 변경 시도 시 예외.
  if new.plan is distinct from old.plan
     or new.premium_until is distinct from old.premium_until then
    raise exception 'plan/premium_until 은 service_role 만 변경할 수 있습니다.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_self_promote_trigger on public.profiles;
create trigger profiles_block_self_promote_trigger
  before update on public.profiles
  for each row execute function public.profiles_block_self_promote();

-- ──────────── 3) cron secret 호출 시 동적 조회로 전환 ────────────
-- 기존 job 은 v_secret 값을 body 에 박아넣은 상태 → cron.job 에 평문 잔존.
-- SECURITY DEFINER 함수 로 wrap 해 호출 시점에 vault.decrypted_secrets 조회.
-- cron.job 본문에는 함수 호출만 남음.

create or replace function public.fetch_rates_shared_secret()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v text;
begin
  select decrypted_secret into v
  from vault.decrypted_secrets
  where name = 'fetch_rates_shared_secret'
  limit 1;
  if v is null then
    raise exception 'fetch_rates_shared_secret 가 vault 에 없습니다.';
  end if;
  return v;
end;
$$;
revoke all on function public.fetch_rates_shared_secret() from public;
grant execute on function public.fetch_rates_shared_secret() to postgres;

do $$
begin
  begin
    perform cron.unschedule('fetch-daily-rates');
  exception when others then
    null;
  end;

  perform cron.schedule(
    'fetch-daily-rates',
    '0 16 * * *',
    $cmd$
      select net.http_post(
        url := 'https://qxbiuueppvqfvfkxgoly.supabase.co/functions/v1/fetch-daily-rates',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-shared-secret', public.fetch_rates_shared_secret()
        ),
        body := jsonb_build_object(
          'startDate', to_char(
            (now() at time zone 'Asia/Seoul')::date - 7,
            'YYYY-MM-DD'
          )
        ),
        timeout_milliseconds := 120000
      );
    $cmd$
  );
end $$;

comment on function public.profiles_block_self_promote is
  'profiles.plan/premium_until 변경을 service_role 외 차단. RLS·GRANT 보호를 보완.';
comment on function public.fetch_rates_shared_secret is
  'cron 호출 시점에 vault 에서 secret 조회. cron.job 본문 평문 노출 차단.';
