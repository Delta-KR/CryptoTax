import { v4 as uuid } from 'uuid';
import type {
  Lot,
  RealizedGain,
  TaxResult,
  UnifiedTransaction,
} from './types';
import { applyDeemedCost, isPreDeemedDate } from './deemed-cost';
import { TAX_CONSTANTS, roundKRW } from './constants';
import {
  buildImputedRealizedGain,
  buildImputedWarning,
  buildSummary,
  buildSummaryByExchange,
  kstYear,
  type TaxCalculatorInput,
} from './tax-calculator';

// 시행령 §88①(2025-02-28 개정) 거주자 총평균법 — §92②4호 정의를 가상자산 양도소득에 적용.
//
// 알고리즘:
// 1. 시행 전(< 2027-01-01) 거래는 코인별 잔량/총가액 누적. 매수는 의제취득가액 적용,
//    매도는 그때까지의 평균가로 잔량·가액 차감만(시행 전 손익은 비과세).
// 2. 시행일 시점 잔량 → 첫 과세기간(2027) 기초 보유.
// 3. 시행 후 거래는 연도별 그룹화. 각 해마다:
//      avgPrice = (기초보유 가액 + 연내 매수 가액) ÷ (기초보유 + 연내 매수)
//      각 매도 손익 = 매도가액 − 매도수량 × avgPrice − 매도부대비용
//      연말 잔량 × avgPrice → 다음 해 기초 보유
//
// FIFO/MA 대비 이점:
// - lot 단위 추적 불필요 (코인별 amount/totalCost만 유지)
// - 거래 순서 정밀도 의존 ↓ (연내 매수 합산만 정확하면 됨)

interface CarryBalance {
  amount: number;
  totalCost: number; // 매수 부대비용 합산 포함
}

interface TAOrphanInfo {
  count: number;
  exchanges: Set<string>;
  firstDate: Date;
  lastDate: Date;
  totalAmount: number;
}

function kstDateStr(d: Date): string {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function buildTAOrphanWarning(coin: string, info: TAOrphanInfo): string {
  const exchanges = Array.from(info.exchanges).sort();
  const exchangeStr =
    exchanges.length === 1 ? exchanges[0] : exchanges.join(', ');
  const firstStr = kstDateStr(info.firstDate);
  const lastStr = kstDateStr(info.lastDate);
  const rangeStr = firstStr === lastStr ? firstStr : `${firstStr} ~ ${lastStr}`;
  const amountStr = info.totalAmount.toLocaleString('ko-KR', {
    maximumFractionDigits: 8,
  });
  return `${coin} 매도 ${info.count}건이 보유량을 초과합니다 (${exchangeStr} · ${rangeStr}, 총 ${amountStr} ${coin}) — 손익 0원으로 처리. 누락된 매수 거래내역을 추가 업로드하거나 의제취득가액 적용 대상인지 확인해주세요.`;
}

export function calculateTaxTotalAverage(
  input: TaxCalculatorInput,
): TaxResult {
  const { transactions, year, deemedCostPrices } = input;
  const warnings: string[] = [];
  const orphans = new Map<string, TAOrphanInfo>();
  const imputed = input.imputedExpenseCoins ?? new Set<string>();
  const imputedSeen = new Set<string>();
  const realizedGains: RealizedGain[] = [];

  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // 시행령 §88④⑤ — 의제 코인 매도를 별도 처리, lot 추적·평균단가 무시
  const nonImputed: UnifiedTransaction[] = [];
  for (const tx of sorted) {
    if (imputed.has(tx.coin)) {
      imputedSeen.add(tx.coin);
      if (tx.type === 'SELL' && kstYear(tx.date) === year) {
        realizedGains.push(buildImputedRealizedGain(tx));
      }
      continue;
    }
    nonImputed.push(tx);
  }

  const preLaunch: UnifiedTransaction[] = [];
  const postLaunch: UnifiedTransaction[] = [];
  for (const tx of nonImputed) {
    if (isPreDeemedDate(tx.date)) preLaunch.push(tx);
    else postLaunch.push(tx);
  }

  // 1. 시행 전: 의제취득가액 적용 + 잔량/가액 누적
  const carry = new Map<string, CarryBalance>();
  for (const tx of preLaunch) {
    const c = carry.get(tx.coin) ?? { amount: 0, totalCost: 0 };
    if (tx.type === 'BUY') {
      const r = applyDeemedCost(tx, deemedCostPrices);
      if (r.warning) warnings.push(r.warning);
      c.amount += tx.amount;
      c.totalCost += r.pricePerUnitKRW * tx.amount + tx.feeKRW;
    } else if (tx.type === 'SELL') {
      if (c.amount > 0) {
        const avg = c.totalCost / c.amount;
        const consumed = Math.min(tx.amount, c.amount);
        c.amount -= consumed;
        c.totalCost -= avg * consumed;
      }
      // 시행 전 orphan은 비과세 영역이라 별도 처리 안 함
    }
    carry.set(tx.coin, c);
  }

  // 2. 시행 후: 연도별 그룹화. input.year에 거래가 없어도 holdingsAfter 산출 위해 키 보장.
  const byYear = new Map<number, UnifiedTransaction[]>();
  for (const tx of postLaunch) {
    const y = kstYear(tx.date);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(tx);
  }
  if (year >= 2027 && !byYear.has(year)) byYear.set(year, []);

  const sortedYears = [...byYear.keys()].sort((a, b) => a - b);
  let yearEndCarry: Map<string, CarryBalance> | null = null;

  for (const y of sortedYears) {
    const txsOfYear = byYear.get(y)!;
    const byCoin = new Map<
      string,
      { buys: UnifiedTransaction[]; sells: UnifiedTransaction[] }
    >();
    for (const tx of txsOfYear) {
      if (!byCoin.has(tx.coin)) byCoin.set(tx.coin, { buys: [], sells: [] });
      const g = byCoin.get(tx.coin)!;
      if (tx.type === 'BUY') g.buys.push(tx);
      else if (tx.type === 'SELL') g.sells.push(tx);
    }

    const newCarry = new Map<string, CarryBalance>();
    // 거래 없는 코인도 carry-over
    for (const [coin, c] of carry) {
      if (!byCoin.has(coin)) newCarry.set(coin, { ...c });
    }

    for (const [coin, { buys, sells }] of byCoin) {
      const carryC = carry.get(coin) ?? { amount: 0, totalCost: 0 };
      const buyAmount = buys.reduce((s, b) => s + b.amount, 0);
      const buyCost = buys.reduce((s, b) => s + b.totalKRW + b.feeKRW, 0);

      const totalAmount = carryC.amount + buyAmount;
      const totalCost = carryC.totalCost + buyCost;
      const avgPrice = totalAmount > 0 ? totalCost / totalAmount : 0;

      let consumedAmount = 0;
      for (const sell of sells) {
        // 보유량 초과 매도(orphan): 손익 0 + 매도 수수료만 손실 처리
        if (consumedAmount + sell.amount > totalAmount + 1e-8) {
          const info = orphans.get(coin) ?? {
            count: 0,
            exchanges: new Set<string>(),
            firstDate: sell.date,
            lastDate: sell.date,
            totalAmount: 0,
          };
          info.count += 1;
          info.exchanges.add(sell.exchange);
          if (sell.date.getTime() < info.firstDate.getTime())
            info.firstDate = sell.date;
          if (sell.date.getTime() > info.lastDate.getTime())
            info.lastDate = sell.date;
          info.totalAmount += sell.amount;
          orphans.set(coin, info);

          if (kstYear(sell.date) === year) {
            realizedGains.push({
              id: uuid(),
              coin,
              sellDate: sell.date,
              sellAmount: sell.amount,
              proceedsKRW: sell.totalKRW,
              costBasisKRW: sell.totalKRW, // 손익 0 도출
              sellFeeKRW: sell.feeKRW,
              buyFeeKRW: 0,
              pnlKRW: roundKRW(-sell.feeKRW) + 0, // -0 → +0 정규화
              exchange: sell.exchange,
              consumedLots: [],
            });
          }
          // 잔량 음수 방지: consume 안 함
          continue;
        }

        const costBasis = sell.amount * avgPrice;
        const pnl = roundKRW(sell.totalKRW - costBasis - sell.feeKRW);
        consumedAmount += sell.amount;

        if (kstYear(sell.date) === year) {
          realizedGains.push({
            id: uuid(),
            coin,
            sellDate: sell.date,
            sellAmount: sell.amount,
            proceedsKRW: sell.totalKRW,
            costBasisKRW: roundKRW(costBasis),
            sellFeeKRW: sell.feeKRW,
            buyFeeKRW: 0, // 부대비용은 평균단가에 흡수
            pnlKRW: pnl,
            exchange: sell.exchange,
            consumedLots: [], // 총평균법은 lot 추적 안 함
          });
        }
      }

      const endAmount = totalAmount - consumedAmount;
      const endCost = endAmount > 0 ? endAmount * avgPrice : 0;
      newCarry.set(coin, { amount: endAmount, totalCost: endCost });
    }

    carry.clear();
    for (const [k, v] of newCarry) carry.set(k, v);
    if (y === year) yearEndCarry = new Map(carry);
  }

  for (const [coin, info] of orphans) {
    warnings.push(buildTAOrphanWarning(coin, info));
  }

  if (imputedSeen.size > 0) {
    warnings.push(buildImputedWarning(Array.from(imputedSeen)));
  }

  // 세액 계산
  let totalGain = 0;
  let totalLoss = 0;
  for (const g of realizedGains) {
    if (g.pnlKRW > 0) totalGain += g.pnlKRW;
    else totalLoss += g.pnlKRW;
  }
  const netPnL = totalGain + totalLoss;
  const taxable = Math.max(0, netPnL - TAX_CONSTANTS.DEDUCTION_KRW);
  const incomeTax = roundKRW(taxable * TAX_CONSTANTS.INCOME_TAX_RATE);
  const localTax = roundKRW(taxable * TAX_CONSTANTS.LOCAL_TAX_RATE);

  // holdingsAfter — 합성 lot 1개로 잔량 표현 (총평균법은 lot 없음)
  const finalCarry = yearEndCarry ?? carry;
  const holdingsAfter: Record<string, Lot[]> = {};
  for (const [coin, c] of finalCarry) {
    if (c.amount <= 0) continue;
    const pricePerUnit = c.totalCost / c.amount;
    holdingsAfter[coin] = [
      {
        id: uuid(),
        coin,
        amount: c.amount,
        originalAmount: c.amount,
        pricePerUnitKRW: roundKRW(pricePerUnit),
        totalCostKRW: roundKRW(c.totalCost),
        feeKRW: 0,
        date: new Date(`${year}-12-31T00:00:00+09:00`),
        exchange: '통합',
        isDeemedCost: false,
      },
    ];
  }

  return {
    year,
    totalGainKRW: roundKRW(totalGain),
    totalLossKRW: roundKRW(Math.abs(totalLoss)),
    netPnLKRW: roundKRW(netPnL),
    deductionKRW: TAX_CONSTANTS.DEDUCTION_KRW,
    taxableIncomeKRW: taxable,
    taxAmountKRW: incomeTax + localTax,
    incomeTaxKRW: incomeTax,
    localTaxKRW: localTax,
    realizedGains,
    holdingsAfter,
    summary: buildSummary(realizedGains, transactions, year),
    summaryByExchange: buildSummaryByExchange(
      realizedGains,
      transactions,
      year,
    ),
    warnings,
  };
}
