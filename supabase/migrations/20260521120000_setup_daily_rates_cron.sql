-- pg_cron 설치 + fetch-daily-rates 자동 호출 스케줄.
-- 매일 KST 01:00 (= UTC 16:00)에 Edge function을 호출해 어제 종가를 daily_rates 테이블에 적재.
-- 누락 안전망으로 지난 7일치를 매번 backfill (upsert이므로 중복 없음).

create extension if not exists pg_cron with schema extensions;

-- 기존 job이 있으면 제거 (마이그레이션 재실행 시 idempotent).
do $$
begin
  perform cron.unschedule('fetch-daily-rates');
exception when others then
  null;
end $$;

-- 매일 UTC 16:00 (KST 01:00)에 호출.
-- Upbit 일별 캔들은 KST 00:00에 마감되므로 1시간 여유 두고 fetch.
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
    -- pg_net 기본 timeout 5초인데 edge function이 코인당 1.5초 대기 + fetch라
    -- 40코인 backfill에 60초 가량 소요. timeout을 넉넉히 잡지 않으면 net 측에서
    -- 에러 로깅되지만 edge function 자체는 서버 측에서 계속 실행돼 데이터는 적재됨.
    -- 모니터링 가능성을 위해 timeout을 늘림.
    timeout_milliseconds := 60000
  );
  $cmd$
);

comment on extension pg_cron is
  '일별 환율 자동 갱신용. fetch-daily-rates job이 KST 01:00에 edge function 호출.';
