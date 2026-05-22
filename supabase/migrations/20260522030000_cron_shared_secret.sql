-- fetch-daily-rates cron 호출 시 x-shared-secret 헤더 동봉.
-- Edge function이 FETCH_RATES_SHARED_SECRET 환경변수와 비교해 익명 호출 차단.
--
-- 운영 절차 (마이그레이션 적용 전 필수):
--   1) 임의 문자열 생성 (예: openssl rand -hex 32)
--   2) Supabase Dashboard → Project Settings → Edge Functions →
--      "fetch-daily-rates"에 환경변수 FETCH_RATES_SHARED_SECRET=<값> 추가 후 배포
--   3) Supabase Vault에 동일 값 저장:
--        select vault.create_secret('<값>', 'fetch_rates_shared_secret');
--      이미 존재하면:
--        update vault.secrets set secret = '<값>' where name = 'fetch_rates_shared_secret';
--   4) 본 마이그레이션 적용
--
-- 본 마이그레이션은 vault.decrypted_secrets에서 'fetch_rates_shared_secret'을 조회해
-- cron 작업 본문에 동적으로 주입한다. 마이그레이션 적용 시점에 vault에 값이 없으면
-- 헤더가 빈 문자열이 되어 edge function이 401을 반환 — 즉 cron이 무력화되지만
-- 실데이터 적재 실패가 모니터링 가능 (net._http_response 로그).

do $$
declare
  v_secret text;
begin
  -- Vault에서 secret 로드. 미설정이면 빈 문자열로 진행 (위 주석 참고).
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'fetch_rates_shared_secret'
  limit 1;

  if v_secret is null then
    raise warning 'vault.decrypted_secrets에 fetch_rates_shared_secret이 없습니다. cron 호출이 401을 받게 됩니다.';
    v_secret := '';
  end if;

  -- 기존 job 제거 (idempotent).
  begin
    perform cron.unschedule('fetch-daily-rates');
  exception when others then
    null;
  end;

  -- 매일 UTC 16:00 (KST 01:00) 실행. timeout 120s 유지.
  perform cron.schedule(
    'fetch-daily-rates',
    '0 16 * * *',
    format($cmd$
      select net.http_post(
        url := 'https://qxbiuueppvqfvfkxgoly.supabase.co/functions/v1/fetch-daily-rates',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-shared-secret', %L
        ),
        body := jsonb_build_object(
          'startDate', to_char(
            (now() at time zone 'Asia/Seoul')::date - 7,
            'YYYY-MM-DD'
          )
        ),
        timeout_milliseconds := 120000
      );
    $cmd$, v_secret)
  );
end $$;

comment on extension pg_cron is
  '일별 환율 자동 갱신용. fetch-daily-rates job이 KST 01:00에 edge function 호출 (x-shared-secret 헤더 포함).';
