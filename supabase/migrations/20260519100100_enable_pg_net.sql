-- pg_net: Postgres에서 async HTTP 호출 (Edge function 트리거용).
-- Server Action 외부에서 Edge function `fetch-daily-rates`를 SQL로 호출할 때 사용.
create extension if not exists pg_net with schema extensions;
