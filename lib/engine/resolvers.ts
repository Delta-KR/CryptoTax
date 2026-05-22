// 의제취득가액 시가 + 필요경비 의제 50% 코인을 Supabase에서 조회하는 헬퍼.
//
// 사용처:
// - app/actions/calculate.ts: 업로드된 파일을 처음 계산할 때
// - app/api/report/route.ts: PDF 생성 시 서버 재계산 (client 조작 result 무시, C5 방어)

import { createSupabaseServerClient } from '@/lib/supabase/server';

interface DeemedSnapshotRow {
  coin: string;
  price_krw: number | string;
  source_type: 'real' | 'estimate' | 'user_override';
  deemed_date: string;
}

interface UserOverrideRow {
  coin: string;
  price_krw: number | string;
  deemed_date: string;
}

export interface DeemedCostResolution {
  prices: Map<string, number>;
  realCoins: string[];
  estimateCoins: string[];
  userOverrideCoins: string[];
  missingCoins: string[];
  deemedDate: string;
}

export async function resolveDeemedCostPrices(
  preCoins: ReadonlySet<string>,
): Promise<DeemedCostResolution> {
  const supabase = createSupabaseServerClient();

  // v2 #3: 사용자 override 우선 조회. RLS로 본인 row만 반환됨.
  // 글로벌 deemed_cost_snapshots는 fallback. user_override가 있는 코인은 그쪽 값 사용.
  const [globalRes, userOverrideRes] = await Promise.all([
    supabase
      .from('deemed_cost_snapshots')
      .select('coin, price_krw, source_type, deemed_date'),
    supabase
      .from('user_deemed_cost_overrides')
      .select('coin, price_krw, deemed_date'),
  ]);

  const prices = new Map<string, number>();
  const realCoins: string[] = [];
  const estimateCoins: string[] = [];
  const userOverrideCoins: string[] = [];
  let deemedDate = '2026-12-31';

  if (globalRes.error) {
    console.error('[resolveDeemedCostPrices] global error:', globalRes.error);
  } else if (globalRes.data) {
    for (const row of globalRes.data as DeemedSnapshotRow[]) {
      const price = Number(row.price_krw);
      if (!Number.isFinite(price) || price <= 0) continue;
      prices.set(row.coin, price);
      if (row.source_type === 'real') realCoins.push(row.coin);
      else if (row.source_type === 'estimate') estimateCoins.push(row.coin);
      // 글로벌 테이블에 user_override가 들어있는 케이스는 레거시. 새 사용자 입력은
      // 모두 user_deemed_cost_overrides로 들어감.
      else if (row.source_type === 'user_override')
        userOverrideCoins.push(row.coin);
      if (row.deemed_date) deemedDate = row.deemed_date;
    }
  }

  // 사용자 override 적용 — 글로벌 값을 덮어씀. 또한 source 분류를 user_override로 재분류.
  if (userOverrideRes.error) {
    console.error(
      '[resolveDeemedCostPrices] user override error:',
      userOverrideRes.error,
    );
  } else if (userOverrideRes.data) {
    for (const row of userOverrideRes.data as UserOverrideRow[]) {
      const price = Number(row.price_krw);
      if (!Number.isFinite(price) || price <= 0) continue;
      prices.set(row.coin, price);
      // 이미 다른 source로 분류돼 있으면 그 분류에서 제거하고 user_override로 이동.
      const idxReal = realCoins.indexOf(row.coin);
      if (idxReal >= 0) realCoins.splice(idxReal, 1);
      const idxEst = estimateCoins.indexOf(row.coin);
      if (idxEst >= 0) estimateCoins.splice(idxEst, 1);
      if (!userOverrideCoins.includes(row.coin)) {
        userOverrideCoins.push(row.coin);
      }
      if (row.deemed_date) deemedDate = row.deemed_date;
    }
  }

  const missingCoins = Array.from(preCoins).filter((c) => !prices.has(c));
  realCoins.sort();
  estimateCoins.sort();
  userOverrideCoins.sort();
  missingCoins.sort();

  return {
    prices,
    realCoins,
    estimateCoins,
    userOverrideCoins,
    missingCoins,
    deemedDate,
  };
}

// 시행령 §88④⑤ — 사용자가 토글한 필요경비 의제 50% 적용 코인. RLS로 본인 row만 반환.
// 테이블이 prod에 아직 없는 경우(마이그레이션 미적용) 빈 Set로 fallback.
export async function resolveImputedExpenseCoins(): Promise<Set<string>> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_imputed_expense_coins')
    .select('coin');
  if (error) {
    console.error('[resolveImputedExpenseCoins] error:', error);
    return new Set();
  }
  return new Set((data ?? []).map((r: { coin: string }) => r.coin));
}
