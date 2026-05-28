/**
 * 외부 검증 패키지 (docs/legal-review/) 의 시나리오 10건에 대해
 * (1) 거래내역 CSV 와 (2) Kontaxt 엔진 출력 PDF 리포트를 일괄 생성한다.
 *
 * 출력:
 *   docs/legal-review/scenarios/01-basic-buy-sell.csv
 *   docs/legal-review/scenarios/01-basic-buy-sell.pdf
 *   ...
 *   docs/legal-review/scenarios/10-mixed-treatment.csv
 *   docs/legal-review/scenarios/10-mixed-treatment.pdf
 *
 * 실행:
 *   npx tsx scripts/generate-legal-review-artifacts.ts
 *
 * 시나리오 데이터는 lib/engine/__tests__/legal-review-scenarios.test.ts 와 동일.
 * 변경 시 양쪽 모두 sync 필요.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import React from 'react';

import { calculateTax } from '../lib/engine/tax-calculator';
import { resultToWire } from '../lib/engine/wire';
import { ensureFontRegistered } from '../lib/report/font-config';
import { TaxReport } from '../lib/report/tax-report';
import {
  UpbitStatement,
  type UpbitTransactionRow,
} from '../lib/report/upbit-statement';
import type { UnifiedTransaction } from '../lib/engine/types';
import type { UnifiedTransactionWire } from '../app/actions/calculate.types';

// ─────────────────────────────────────────────────────────────
// 헬퍼 — UnifiedTransaction 생성
// ─────────────────────────────────────────────────────────────

let txCounter = 0;
function tx(overrides: Partial<UnifiedTransaction>): UnifiedTransaction {
  txCounter += 1;
  return {
    id: `legal-review-${String(txCounter).padStart(4, '0')}`,
    date: new Date('2027-06-01T00:00:00+09:00'),
    type: 'BUY',
    coin: 'BTC',
    amount: 1,
    pricePerUnitKRW: 50_000_000,
    totalKRW: 50_000_000,
    feeKRW: 0,
    exchange: 'Upbit',
    originalCurrency: 'KRW',
    ...overrides,
  };
}

function unifiedToWire(t: UnifiedTransaction): UnifiedTransactionWire {
  return { ...t, date: t.date.toISOString() };
}

// ─────────────────────────────────────────────────────────────
// 시나리오 데이터 — vitest 와 동일
// ─────────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  title: string;
  year: number;
  transactions: UnifiedTransaction[];
  deemedCostPrices?: Map<string, number>;
  imputedExpenseCoins?: Set<string>;
  notes?: string[];
}

function buildScenarios(): Scenario[] {
  txCounter = 0;
  const scenarios: Scenario[] = [];

  // #1 단일 거래소 단순 매수·매도
  scenarios.push({
    id: '01-basic-buy-sell',
    title: '시나리오 #1 — 단일 거래소 단순 매수·매도',
    year: 2027,
    transactions: [
      tx({ date: new Date('2027-01-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2027-03-20T14:15:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 60_000_000, totalKRW: 3_000_000, feeKRW: 3_000 }),
      tx({ date: new Date('2027-06-10T09:45:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2027-09-15T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-11-30T11:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 90_000_000, totalKRW: 4_500_000, feeKRW: 4_500 }),
    ],
  });

  // #2 의제 코인 매도 (BTC 일반 + ETH 의제 50%)
  scenarios.push({
    id: '02-imputed-expense',
    title: '시나리오 #2 — 의제 코인 매도 (필요경비 의제 50%)',
    year: 2027,
    transactions: [
      tx({ date: new Date('2027-01-15T10:30:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2027-02-10T11:00:00+09:00'), type: 'BUY', coin: 'ETH', amount: 1, pricePerUnitKRW: 4_000_000, totalKRW: 4_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2027-03-20T14:15:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.05, pricePerUnitKRW: 60_000_000, totalKRW: 3_000_000, feeKRW: 3_000 }),
      tx({ date: new Date('2027-05-15T09:00:00+09:00'), type: 'BUY', coin: 'ETH', amount: 2, pricePerUnitKRW: 5_000_000, totalKRW: 10_000_000, feeKRW: 10_000 }),
      tx({ date: new Date('2027-07-10T16:20:00+09:00'), type: 'SELL', coin: 'BTC', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-09-20T11:00:00+09:00'), type: 'SELL', coin: 'ETH', amount: 2, pricePerUnitKRW: 6_000_000, totalKRW: 12_000_000, feeKRW: 12_000 }),
      tx({ date: new Date('2027-11-15T13:30:00+09:00'), type: 'SELL', coin: 'ETH', amount: 1, pricePerUnitKRW: 7_000_000, totalKRW: 7_000_000, feeKRW: 7_000 }),
    ],
    imputedExpenseCoins: new Set(['ETH']),
  });

  // #3 시행 전 보유분 의제취득가액
  scenarios.push({
    id: '03-deemed-cost',
    title: '시나리오 #3 — 시행 전 보유분 의제취득가액',
    year: 2027,
    transactions: [
      tx({ date: new Date('2026-03-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 40_000_000, totalKRW: 4_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2026-09-20T14:15:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 50_000_000, totalKRW: 2_500_000, feeKRW: 2_500 }),
      tx({ date: new Date('2027-02-15T09:00:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2027-08-10T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-12-15T11:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 90_000_000, totalKRW: 4_500_000, feeKRW: 4_500 }),
    ],
    deemedCostPrices: new Map([['BTC', 60_000_000]]),
  });

  // #4 Binance USDT 일별 환율 (KRW 환산 후)
  scenarios.push({
    id: '04-fx-conversion',
    title: '시나리오 #4 — 해외 거래소 USD 일별 환율',
    year: 2027,
    transactions: [
      tx({ date: new Date('2027-02-10T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 52_000_000, totalKRW: 5_200_000, feeKRW: 5_200, exchange: 'Binance', originalCurrency: 'USDT' }),
      tx({ date: new Date('2027-06-15T14:15:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 67_500_000, totalKRW: 3_375_000, feeKRW: 3_375, exchange: 'Binance', originalCurrency: 'USDT' }),
      tx({ date: new Date('2027-10-20T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 98_000_000, totalKRW: 9_800_000, feeKRW: 9_800, exchange: 'Binance', originalCurrency: 'USDT' }),
    ],
  });

  // #5 다년 손익 (year=2027 단일 PDF — 손실)
  // 3년 carry 는 사용자/CPA 수동, PDF 는 2027 손실만 표시
  scenarios.push({
    id: '05-carry-over',
    title: '시나리오 #5 — 다년 손익 통산 (2027 손실 PDF, carry 수동)',
    year: 2027,
    transactions: [
      tx({ date: new Date('2027-03-15T10:00:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-10-20T10:00:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2028-04-10T10:00:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2028-11-15T10:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 100_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2029-05-20T10:00:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 60_000_000, totalKRW: 3_000_000, feeKRW: 3_000 }),
      tx({ date: new Date('2029-12-10T10:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 200_000_000, totalKRW: 10_000_000, feeKRW: 10_000 }),
    ],
    notes: ['PDF 는 year=2027 (손실) 만 표시. 2028·2029 은 동일 데이터 year= 만 바꿔서 추가 생성 가능.'],
  });

  // #6 다거래소 + orphan
  scenarios.push({
    id: '06-multi-exchange-orphan',
    title: '시나리오 #6 — 다거래소 통합 + orphan 매도',
    year: 2027,
    transactions: [
      tx({ date: new Date('2027-02-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000, exchange: 'Upbit' }),
      tx({ date: new Date('2027-05-20T14:15:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000, exchange: 'Upbit' }),
      tx({ date: new Date('2027-08-10T16:20:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 90_000_000, totalKRW: 4_500_000, feeKRW: 4_500, exchange: 'Bithumb' }),
    ],
  });

  // #7 KST 경계
  scenarios.push({
    id: '07-kst-boundary',
    title: '시나리오 #7 — KST 경계 거래 (시행일 부칙)',
    year: 2027,
    transactions: [
      tx({ date: new Date('2026-12-31T23:30:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 50_000_000, totalKRW: 2_500_000, feeKRW: 5_000 }),
      tx({ date: new Date('2027-01-01T00:30:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 55_000_000, totalKRW: 2_750_000, feeKRW: 5_500 }),
      tx({ date: new Date('2027-06-15T14:00:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 100_000_000, totalKRW: 10_000_000, feeKRW: 10_000 }),
    ],
    deemedCostPrices: new Map([['BTC', 60_000_000]]),
  });

  // #8 동일 timestamp 5건
  const sameTime = new Date('2027-03-10T14:00:00+09:00');
  scenarios.push({
    id: '08-same-timestamp',
    title: '시나리오 #8 — 동일 timestamp 대량 거래 합산',
    year: 2027,
    transactions: [
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 50_000_000, totalKRW: 1_000_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 51_000_000, totalKRW: 1_020_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 52_000_000, totalKRW: 1_040_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 53_000_000, totalKRW: 1_060_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 54_000_000, totalKRW: 1_080_000, feeKRW: 1_000 }),
      tx({ date: new Date('2027-10-15T11:00:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 150_000_000, totalKRW: 15_000_000, feeKRW: 15_000 }),
    ],
  });

  // #9 거래소 간 이동 (transfer 무시)
  scenarios.push({
    id: '09-cross-exchange-transfer',
    title: '시나리오 #9 — 거래소 간 이동 (transfer 처리)',
    year: 2027,
    transactions: [
      tx({ date: new Date('2027-02-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000, exchange: 'Upbit' }),
      tx({ date: new Date('2027-08-10T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000, exchange: 'Bithumb' }),
    ],
  });

  // #10 mix (BTC 의제취득가 + ETH·DOGE 의제 50%)
  scenarios.push({
    id: '10-mixed-treatment',
    title: '시나리오 #10 — 부분 의제 + 실가 + 의제취득가액 mix',
    year: 2027,
    transactions: [
      tx({ date: new Date('2026-09-15T10:30:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.05, pricePerUnitKRW: 40_000_000, totalKRW: 2_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2027-02-10T11:00:00+09:00'), type: 'BUY', coin: 'ETH', amount: 1, pricePerUnitKRW: 4_000_000, totalKRW: 4_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2027-04-20T14:15:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2027-06-15T09:00:00+09:00'), type: 'BUY', coin: 'DOGE', amount: 100, pricePerUnitKRW: 1_000, totalKRW: 100_000, feeKRW: 100 }),
      tx({ date: new Date('2027-09-10T16:20:00+09:00'), type: 'SELL', coin: 'BTC', amount: 0.1, pricePerUnitKRW: 90_000_000, totalKRW: 9_000_000, feeKRW: 9_000 }),
      tx({ date: new Date('2027-11-20T11:00:00+09:00'), type: 'SELL', coin: 'ETH', amount: 1, pricePerUnitKRW: 6_000_000, totalKRW: 6_000_000, feeKRW: 6_000 }),
      tx({ date: new Date('2027-12-15T13:30:00+09:00'), type: 'SELL', coin: 'DOGE', amount: 100, pricePerUnitKRW: 1_500, totalKRW: 150_000, feeKRW: 150 }),
    ],
    deemedCostPrices: new Map([['BTC', 60_000_000]]),
    imputedExpenseCoins: new Set(['ETH', 'DOGE']),
  });

  return scenarios;
}

// ─────────────────────────────────────────────────────────────
// CSV 생성
// ─────────────────────────────────────────────────────────────

function toKstStr(d: Date): string {
  // KST (UTC+9) 표시
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const iso = kst.toISOString();
  return iso.slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:MM
}

function txTypeKr(t: 'BUY' | 'SELL'): string {
  return t === 'BUY' ? '매수' : '매도';
}

function generateCsv(scenario: Scenario): string {
  const header = [
    '#',
    '일시 (KST)',
    '거래소',
    '코인',
    '종류',
    '수량',
    '단가 (KRW)',
    '거래금액 (KRW)',
    '수수료 (KRW)',
    '원본 통화',
  ].join(',');

  const rows = scenario.transactions.map((t, i) => [
    String(i + 1),
    `"${toKstStr(t.date)}"`,
    t.exchange,
    t.coin,
    txTypeKr(t.type),
    String(t.amount),
    String(t.pricePerUnitKRW),
    String(t.totalKRW),
    String(t.feeKRW),
    t.originalCurrency,
  ].join(','));

  const lines = [`# ${scenario.title}`, '', header, ...rows];

  // 의제·환율 메타 정보
  if (scenario.deemedCostPrices && scenario.deemedCostPrices.size > 0) {
    lines.push('');
    lines.push('# 의제취득가액 시가 (2026-12-31 24:00 KST 기준)');
    lines.push('코인,시가 (KRW)');
    for (const [coin, price] of scenario.deemedCostPrices) {
      lines.push(`${coin},${price}`);
    }
  }
  if (scenario.imputedExpenseCoins && scenario.imputedExpenseCoins.size > 0) {
    lines.push('');
    lines.push('# 의제 코인 (필요경비 의제 50% 적용 대상)');
    for (const coin of scenario.imputedExpenseCoins) {
      lines.push(coin);
    }
  }

  return lines.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────
// PDF 생성
// ─────────────────────────────────────────────────────────────

async function generatePdf(scenario: Scenario): Promise<Buffer> {
  const result = calculateTax({
    transactions: scenario.transactions,
    year: scenario.year,
    method: 'totalAverage',
    deemedCostPrices: scenario.deemedCostPrices,
    imputedExpenseCoins: scenario.imputedExpenseCoins,
  });

  const wire = resultToWire(result, 'premium');
  wire.rateSource = {
    primary: '검증용 가상 환율 (시나리오 정의)',
    fallbackUsed: false,
    lastFetchedAt: null,
    fallbackName: '정적 환율 (fallback)',
  };
  wire.deemedCostSource = {
    realCoins: scenario.deemedCostPrices ? Array.from(scenario.deemedCostPrices.keys()) : [],
    estimateCoins: [],
    userOverrideCoins: [],
    missingCoins: [],
    deemedDate: '2026-12-31',
  };

  const txsWire = scenario.transactions.map(unifiedToWire);

  const buffer = await renderToBuffer(
    React.createElement(TaxReport, {
      userName: `검증용 가상 사용자 (${scenario.id})`,
      year: scenario.year,
      result: wire,
      transactions: txsWire,
      method: 'totalAverage',
    }),
  );

  return buffer;
}

// ─────────────────────────────────────────────────────────────
// Binance-style CSV — 실 거래소 다운로드 형식 (`lib/parsers/binance-spot.parser.ts` 호환)
// ─────────────────────────────────────────────────────────────

// 시나리오 #4 의 환율 정보 (시나리오 .md §1-2 와 동일) — script 와 시나리오 데이터 단일 source
const BINANCE_SCENARIO_FX: Record<string, number> = {
  '2027-02-10': 1300,
  '2027-06-15': 1350,
  '2027-10-20': 1400,
};

interface BinanceTradeRow {
  Time: string; // "YY-MM-DD HH:MM:SS" (KST)
  Pair: string; // "BTCUSDT"
  Side: 'BUY' | 'SELL';
  Price: string; // USDT 표시
  Executed: string; // 값+단위, 예: "0.10000000BTC"
  Amount: string; // 값+단위, 예: "4000USDT"
  Fee: string; // 값+단위, 예: "4USDT"
}

function formatBinanceTime(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const yy = String(kst.getUTCFullYear()).slice(2);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const mi = String(kst.getUTCMinutes()).padStart(2, '0');
  const ss = String(kst.getUTCSeconds()).padStart(2, '0');
  return `${yy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function unifiedToBinanceRow(t: UnifiedTransaction): BinanceTradeRow {
  const kstDateKey = new Date(t.date.getTime() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const fxRate = BINANCE_SCENARIO_FX[kstDateKey];
  if (!fxRate) {
    throw new Error(
      `[binance-csv] FX rate 누락: ${kstDateKey} — BINANCE_SCENARIO_FX 갱신 필요`,
    );
  }
  // KRW → USDT 역변환 (시나리오 .md §1-2 의 sample 환율 사용)
  const priceUsdt = t.pricePerUnitKRW / fxRate;
  const totalUsdt = t.totalKRW / fxRate;
  const feeUsdt = t.feeKRW / fxRate;
  return {
    Time: formatBinanceTime(t.date),
    Pair: `${t.coin}USDT`,
    Side: t.type,
    Price: priceUsdt.toFixed(2),
    Executed: `${t.amount}${t.coin}`,
    Amount: `${totalUsdt}USDT`,
    Fee: `${feeUsdt}USDT`,
  };
}

function generateBinanceCsv(scenario: Scenario): string | null {
  const binanceTxs = scenario.transactions.filter(
    (t) => t.exchange === 'Binance',
  );
  if (binanceTxs.length === 0) return null;

  const header = 'Time,Pair,Side,Price,Executed,Amount,Fee';
  const rows = binanceTxs.map((t) => {
    const r = unifiedToBinanceRow(t);
    return [
      r.Time,
      r.Pair,
      r.Side,
      r.Price,
      r.Executed,
      r.Amount,
      r.Fee,
    ].join(',');
  });
  return [header, ...rows].join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────
// Upbit-style PDF — 실 거래소 다운로드 형식 흉내
// ─────────────────────────────────────────────────────────────

function unifiedToUpbitRow(t: UnifiedTransaction): UpbitTransactionRow {
  const settlement =
    t.type === 'BUY' ? t.totalKRW + t.feeKRW : t.totalKRW - t.feeKRW;
  return {
    executedAt: t.date,
    coin: t.coin,
    market: 'KRW',
    type: t.type === 'BUY' ? '매수' : '매도',
    amount: t.amount,
    amountUnit: t.coin,
    pricePerUnitKRW: t.pricePerUnitKRW,
    totalKRW: t.totalKRW,
    feeKRW: t.feeKRW,
    settlementKRW: settlement,
    orderedAt: t.date, // 시나리오 데이터 단순화 — 실제 PDF 와 동일
  };
}

async function generateUpbitPdf(scenario: Scenario): Promise<Buffer | null> {
  const upbitTxs = scenario.transactions.filter(
    (t) => t.exchange === 'Upbit',
  );
  if (upbitTxs.length === 0) return null;

  const rows = upbitTxs.map(unifiedToUpbitRow);
  const lastTxTime = upbitTxs
    .map((t) => t.date.getTime())
    .reduce((a, b) => Math.max(a, b), 0);
  const printedAt = new Date(lastTxTime + 7 * 24 * 3600 * 1000);

  const buffer = await renderToBuffer(
    React.createElement(UpbitStatement, {
      rows,
      printedAt,
    }),
  );
  return buffer;
}

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), 'docs', 'legal-review', 'scenarios');

  if (!existsSync(outDir)) {
    await mkdir(outDir, { recursive: true });
  }

  ensureFontRegistered();

  const scenarios = buildScenarios();
  console.log(`[legal-review-artifacts] 시나리오 ${scenarios.length}건 처리 시작.\n`);

  for (const scenario of scenarios) {
    const csvPath = path.join(outDir, `${scenario.id}.csv`);
    const pdfPath = path.join(outDir, `${scenario.id}.pdf`);

    // CSV
    const csv = generateCsv(scenario);
    await writeFile(csvPath, csv, 'utf8');
    console.log(`  ✓ CSV: ${path.relative(process.cwd(), csvPath)} (${csv.length}B)`);

    // PDF (Kontaxt 출력 리포트)
    const pdfBuffer = await generatePdf(scenario);
    await writeFile(pdfPath, pdfBuffer);
    console.log(`  ✓ PDF: ${path.relative(process.cwd(), pdfPath)} (${pdfBuffer.length}B)`);

    // Upbit-style PDF (Upbit 거래가 있는 시나리오만 — 실 거래소 다운로드 형식 흉내)
    const upbitPdfBuffer = await generateUpbitPdf(scenario);
    if (upbitPdfBuffer) {
      const upbitPath = path.join(outDir, `${scenario.id}.upbit.pdf`);
      await writeFile(upbitPath, upbitPdfBuffer);
      console.log(
        `  ✓ Upbit PDF: ${path.relative(process.cwd(), upbitPath)} (${upbitPdfBuffer.length}B)`,
      );
    }

    // Binance-style CSV (Binance 거래가 있는 시나리오만 — 실 거래소 다운로드 형식)
    const binanceCsv = generateBinanceCsv(scenario);
    if (binanceCsv) {
      const binancePath = path.join(outDir, `${scenario.id}.binance.csv`);
      await writeFile(binancePath, binanceCsv, 'utf8');
      console.log(
        `  ✓ Binance CSV: ${path.relative(process.cwd(), binancePath)} (${binanceCsv.length}B)`,
      );
    }
  }

  console.log(`\n[legal-review-artifacts] 완료.`);
}

main().catch((e) => {
  console.error('[legal-review-artifacts] error:', e);
  process.exit(1);
});
