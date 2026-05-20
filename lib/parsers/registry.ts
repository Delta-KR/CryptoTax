import type { ParsedTransaction } from '@/lib/engine/types';
import {
  type ExchangeParser,
  UnsupportedFileError,
} from './parser.interface';
import { binanceSpotParser } from './binance-spot.parser';
import { upbitParser } from './upbit.parser';

export const parsers: readonly ExchangeParser[] = [
  binanceSpotParser,
  upbitParser,
];

async function sniffSample(file: File): Promise<string> {
  try {
    const slice = file.slice(0, 1024);
    return await slice.text();
  } catch {
    return '';
  }
}

export function isBinanceFutures(filename: string, sample: string): boolean {
  if (/Binance-?Futures/i.test(filename)) return true;
  return sample.includes('Realized Profit');
}

// 바이낸스 '주문 내역(Order History)' export — Trade History와 다른 형식.
// 수수료(Fee) 컬럼 부재 + CANCELED 행 혼재 → 손익 계산 불가능. 사용자에게 Trade History 안내.
export function isBinanceOrderHistory(
  filename: string,
  sample: string,
): boolean {
  if (/Binance-?Spot-?Order-?History/i.test(filename)) return true;
  // 헤더에 OrderNo + Status 둘 다 있으면 Order History (Trade History에는 둘 다 없음)
  const firstLine = sample.split('\n')[0] ?? '';
  return firstLine.includes('OrderNo') && firstLine.includes('Status');
}

export function findParser(
  filename: string,
  sample: string,
): ExchangeParser | undefined {
  return parsers.find((p) => p.canParse(filename, sample));
}

export async function parseFile(file: File): Promise<ParsedTransaction[]> {
  const sample = await sniffSample(file);

  if (isBinanceFutures(file.name, sample)) {
    throw new UnsupportedFileError(
      'Binance 선물(Futures) 거래내역은 현재 지원하지 않습니다. Spot 거래내역만 업로드해주세요.',
    );
  }

  if (isBinanceOrderHistory(file.name, sample)) {
    throw new UnsupportedFileError(
      "바이낸스 '주문 내역(Order History)' 파일이 업로드됐습니다. 이 파일은 수수료가 없고 미체결 주문이 섞여 있어 정확한 손익 계산이 불가능합니다. 대신 '거래 내역(Trade History)'을 받아주세요. (바이낸스 웹 → Orders → Spot Order → Trade History 탭 → Export. 파일명이 'Binance-Spot-Trade-History-...'로 시작합니다.)",
    );
  }

  const parser = findParser(file.name, sample);
  if (!parser) {
    throw new UnsupportedFileError(
      `지원하지 않는 파일입니다: ${file.name}. 현재 지원: 업비트 PDF, 바이낸스 Spot 거래 내역(Trade History) CSV.`,
    );
  }
  return parser.parse(file);
}
