-- Audit followup hotfix: SECURITY DEFINER 함수의 anon/authenticated EXECUTE 노출 차단.
--
-- 2026-05-23 PR #33 (`lockdown_profiles_and_cron_secret`) prod apply 후 Supabase
-- Security Advisor 가 4건 신규 critical 보고:
--   1) public.fetch_rates_shared_secret() - anon EXECUTE 가능
--   2) public.fetch_rates_shared_secret() - authenticated EXECUTE 가능
--   3) public.profiles_block_self_promote() - anon EXECUTE 가능
--   4) public.profiles_block_self_promote() - authenticated EXECUTE 가능
--
-- 원인: 이전 마이그레이션이 `revoke all on function ... from public` 만 적용했는데
-- Supabase 는 anon/authenticated 에 default grant 를 별도 라인으로 부여하므로
-- PUBLIC revoke 로는 막을 수 없다. PostgREST 는 public schema 의 SECURITY DEFINER
-- 함수를 자동으로 `/rest/v1/rpc/<fn>` endpoint 로 expose →
--   - `fetch_rates_shared_secret` 호출 시 vault.decrypted_secrets 의 secret 이 응답 body 로 노출 (CRITICAL).
--   - `profiles_block_self_promote` 는 trigger function 이지만 RPC 로 직접 호출 가능 (영향 낮음).
--
-- Fix: 두 함수 모두 anon / authenticated / PUBLIC 에서 EXECUTE 회수. postgres 만 남김.
--   - fetch_rates_shared_secret: cron job (postgres role) 이 SECURITY DEFINER 로 호출 → 정상 작동.
--   - profiles_block_self_promote: BEFORE UPDATE trigger fire 시 trigger context 로 실행 → 정상 작동.

revoke execute on function public.fetch_rates_shared_secret() from public;
revoke execute on function public.fetch_rates_shared_secret() from anon;
revoke execute on function public.fetch_rates_shared_secret() from authenticated;

revoke execute on function public.profiles_block_self_promote() from public;
revoke execute on function public.profiles_block_self_promote() from anon;
revoke execute on function public.profiles_block_self_promote() from authenticated;
