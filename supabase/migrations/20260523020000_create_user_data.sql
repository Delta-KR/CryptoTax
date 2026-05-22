-- user_data — 사용자 세션 데이터 server-side 백업 (단일 JSONB blob per user).
--
-- 배경: 거래 데이터가 그동안 localStorage 만 보관 → cross-device 불가 + 결제
-- 영수증의 trust anchor 부재. CEO review (subagent) 가 relational transactions
-- 테이블 (v1 plan) 을 reject — premise 검증 안 됨 + Phase 7 launch schema
-- lock-in 위험. Counter-plan: 단일 blob 로 최소 backup 만 제공, relational
-- schema 는 50+ paying users 후 access pattern 보고 결정.
--
-- payload 형식: lib/storage/session.ts 의 SessionData 그대로 (sessionSchema
-- 로 client/server 양쪽 validate). PostgreSQL JSONB 한도 1GB, 예상 payload
-- 5000 거래 ≈ 500KB → 충분.

CREATE TABLE IF NOT EXISTS public.user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 본인 row select/insert/update — auth.uid() = user_id.
-- delete 정책 없음: CASCADE 로 user 삭제 시 자동 정리.

CREATE POLICY user_data_select_own ON public.user_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_data_insert_own ON public.user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_data_update_own ON public.user_data
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_data IS
  'User session data server-side backup (단일 JSONB blob per user). payload = lib/storage/session.ts 의 SessionData 형식. relational transactions table 은 Phase 7 launch + 50+ paying users 후 access pattern 보고 결정.';
COMMENT ON COLUMN public.user_data.payload IS
  'SessionData: { allParsed, allUnified, result, year, method, uploads }. sessionSchema (Zod) 로 client/server 양쪽 validate.';
