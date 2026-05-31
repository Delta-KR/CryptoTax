import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toGainBucket, toTaxBucket } from '@/lib/telemetry/buckets';

export interface PricingTelemetryInput {
  userId: string;
  txCount: number;
  exchangeCount: number;
  coinCount: number;
  netPnLKRW: number;
  taxAmountKRW: number;
  plan: 'free' | 'onetime' | 'premium';
  method: 'totalAverage' | 'fifo' | 'avg';
  year: number;
  deemedApplied: boolean;
}

/**
 * 건수 티어 의사결정용 telemetry 1행 insert. authed user 한정.
 * 원값(KRW)은 bucket 으로만 저장. caller 가 fire-and-forget 으로 호출하고
 * .catch 로 에러를 흡수한다 (본 계산 응답 영향 0).
 */
export async function recordPricingTelemetry(
  input: PricingTelemetryInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('pricing_telemetry').insert({
    user_id: input.userId,
    tx_count: input.txCount,
    exchange_count: input.exchangeCount,
    coin_count: input.coinCount,
    gain_bucket: toGainBucket(input.netPnLKRW),
    tax_bucket: toTaxBucket(input.taxAmountKRW),
    plan: input.plan,
    method: input.method,
    year: input.year,
    deemed_applied: input.deemedApplied,
  });
  if (error) throw error;
}
