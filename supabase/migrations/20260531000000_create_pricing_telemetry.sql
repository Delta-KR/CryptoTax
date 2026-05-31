-- pricing_telemetry — 건수 티어 의사결정용 telemetry (CLAUDE.md P3 / 💰 가격 전략).
--
-- 목적: 가격 티어를 데이터로 결정. MVP 가격(₩49,900 단일)은 안 건드리고
-- 측정 장치만. 핵심 질문 = (1) 거래 건수 분포 (2) 고건수가 세금도 많은가
-- (3) 무제한 구독 escape 비율. 첫 시즌 데이터로 답.
--
-- Privacy: 원값 저장 0 — KRW·코인명·거래소명 제외, bucket 만. authed user 만
-- insert (익명 IP fallback 안 함 — PIPA 키 회피). RRN 미수집(전체 정책). RLS
-- SELECT 정책 없음 → 본인도 조회 불가, service_role 만 분석. CASCADE 자동 정리.
-- 패턴: user_data (20260523020000) 답습.

CREATE TABLE IF NOT EXISTS public.pricing_telemetry (
  id           bigserial PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- cost-to-serve proxy
  tx_count       int NOT NULL CHECK (tx_count >= 0),
  exchange_count smallint NOT NULL CHECK (exchange_count >= 0),
  coin_count     smallint NOT NULL CHECK (coin_count >= 0),

  -- WTP proxy — bucket only, 원값 저장 0
  gain_bucket text NOT NULL CHECK (gain_bucket IN ('none','under_250','under_1000','under_5000','over_5000')),
  tax_bucket  text NOT NULL CHECK (tax_bucket  IN ('none','under_100','under_500','under_2000','over_2000')),

  -- 결제 컨텍스트
  plan           text NOT NULL CHECK (plan IN ('free','onetime','premium')),
  method         text NOT NULL CHECK (method IN ('totalAverage','fifo','avg')),
  year           smallint NOT NULL,
  deemed_applied boolean NOT NULL
);

CREATE INDEX IF NOT EXISTS pricing_telemetry_created_at_idx
  ON public.pricing_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS pricing_telemetry_user_id_idx
  ON public.pricing_telemetry (user_id);

ALTER TABLE public.pricing_telemetry ENABLE ROW LEVEL SECURITY;

-- 본인 row insert 만 허용. SELECT/UPDATE/DELETE 정책 없음 (service_role 만 분석).
CREATE POLICY pricing_telemetry_insert_own ON public.pricing_telemetry
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.pricing_telemetry IS
  '건수 티어 의사결정용 telemetry (CLAUDE.md P3). 원값 0 — bucket 만. authed user 만 insert. 분석은 service_role.';
