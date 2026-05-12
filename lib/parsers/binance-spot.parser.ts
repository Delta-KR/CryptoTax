import Papa from 'papaparse';
import { v4 as uuid } from 'uuid';
import {
  type ParsedTransaction,
  FIAT_LIKE_QUOTES,
} from '@/lib/engine/types';
import { type ExchangeParser, ParseError } from './parser.interface';

const KNOWN_QUOTES = [
  'USDT',
  'USDC',
  'BUSD',
  'FDUSD',
  'TRY',
  'EUR',
  'USD',
  'KRW',
  'BNB',
  'BTC',
  'ETH',
] as const;

const HEADER = 'Time,Pair,Side,Price,Executed,Amount,Fee';
const FUTURES_MARKER = 'Realized Profit';

interface BinanceSpotRow {
  Time: string;
  Pair: string;
  Side: string;
  Price: string;
  Executed: string;
  Amount: string;
  Fee: string;
}

function splitValueUnit(s: string): { value: number; unit: string } {
  const trimmed = s.trim();
  const m = trimmed.match(/^([\d.,]+)\s*([A-Z0-9]+)$/i);
  if (!m) throw new ParseError(`잘못된 수치·단위 형식: "${s}"`);
  const value = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(value)) {
    throw new ParseError(`수치 파싱 실패: "${s}"`);
  }
  return { value, unit: m[2].toUpperCase() };
}

function splitPair(pair: string): { base: string; quote: string } {
  for (const q of KNOWN_QUOTES) {
    if (pair.endsWith(q) && pair.length > q.length) {
      return { base: pair.slice(0, -q.length), quote: q };
    }
  }
  throw new ParseError(`알 수 없는 거래쌍: "${pair}"`);
}

function parseTime(s: string): Date {
  const m = s.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) throw new ParseError(`날짜 파싱 실패: "${s}"`);
  const yy = parseInt(m[1], 10);
  const year = yy + 2000;
  return new Date(
    `${year}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`,
  );
}

export function parseText(text: string): ParsedTransaction[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];

  if (trimmed.includes(FUTURES_MARKER)) {
    throw new ParseError(
      'Binance 선물(Futures) 거래내역은 현재 지원하지 않습니다. Spot 거래내역만 업로드해주세요.',
    );
  }

  const firstLine = trimmed.split('\n')[0].trim();
  if (firstLine !== HEADER) {
    throw new ParseError(
      `Binance Spot CSV 헤더가 예상과 다릅니다. 예상: "${HEADER}", 실제: "${firstLine}"`,
    );
  }

  const result = Papa.parse<BinanceSpotRow>(trimmed, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    const e = result.errors[0];
    throw new ParseError(`CSV 파싱 오류 (행 ${e.row}): ${e.message}`);
  }

  const txs: ParsedTransaction[] = [];
  for (const r of result.data) {
    if (!r.Time || !r.Pair) continue;

    const date = parseTime(r.Time);
    const { base, quote } = splitPair(r.Pair);
    const executed = splitValueUnit(r.Executed);
    const total = splitValueUnit(r.Amount);
    const fee = splitValueUnit(r.Fee);
    const price = parseFloat(r.Price);
    if (Number.isNaN(price)) {
      throw new ParseError(`Price 파싱 실패: "${r.Price}"`);
    }

    const side = r.Side.toUpperCase();
    if (side !== 'BUY' && side !== 'SELL') {
      throw new ParseError(`알 수 없는 Side: "${r.Side}"`);
    }

    if (executed.unit !== base) {
      throw new ParseError(
        `Executed 단위 "${executed.unit}" ≠ pair base "${base}" (pair=${r.Pair})`,
      );
    }
    if (total.unit !== quote) {
      throw new ParseError(
        `Amount 단위 "${total.unit}" ≠ pair quote "${quote}" (pair=${r.Pair})`,
      );
    }

    const isSwap = !FIAT_LIKE_QUOTES.includes(quote);

    txs.push({
      id: uuid(),
      date,
      type: side,
      coin: base,
      amount: executed.value,
      pricePerUnit: price,
      total: total.value,
      fee: fee.value,
      exchange: 'Binance',
      quoteCurrency: quote,
      feeCurrency: fee.unit,
      ...(isSwap && { isSwap: true }),
    });
  }

  return txs;
}

export const binanceSpotParser: ExchangeParser = {
  id: 'binance-spot',
  name: '바이낸스 (Spot)',
  extensions: ['.csv'],
  canParse(filename, sample) {
    if (!filename.toLowerCase().endsWith('.csv')) return false;
    if (sample.includes(FUTURES_MARKER)) return false;
    const firstLine = sample.split('\n')[0]?.trim() ?? '';
    return firstLine === HEADER;
  },
  async parse(file: File) {
    const text = await file.text();
    return parseText(text);
  },
};
