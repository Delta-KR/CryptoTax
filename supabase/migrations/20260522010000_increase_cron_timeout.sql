-- pg_net.http_post timeout 60s → 120s.
-- 첫 cron 자동 실행 (2026-05-22 01:00 KST) 결과 분석:
--   - Edge function status_code=200, execution_time_ms=62282 (62.3초)
--   - daily_rates 7일 backfill (5/15~5/21) 정상 upsert 완료
--   - 그러나 net._http_response.timed_out=true, status_code=null
-- 즉 함수는 성공했지만 pg_net이 응답을 못 받아 모니터링 불가.
-- 코인 수가 늘어나면 더 오래 걸릴 가능성도 있어 timeout을 2배로.

do $$
begin
  perform cron.unschedule('fetch-daily-rates');
exception when others then
  null;
end $$;

select cron.schedule(
  'fetch-daily-rates',
  '0 16 * * *',
  $cmd$
  select net.http_post(
    url := 'https://qxbiuueppvqfvfkxgoly.supabase.co/functions/v1/fetch-daily-rates',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'startDate', to_char(
        (now() at time zone 'Asia/Seoul')::date - 7,
        'YYYY-MM-DD'
      )
    ),
    -- 첫 자동 실행 62.3초 측정. 향후 코인 확장 여유분 포함 120초.
    timeout_milliseconds := 120000
  );
  $cmd$
);
