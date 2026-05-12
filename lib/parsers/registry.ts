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

  const parser = findParser(file.name, sample);
  if (!parser) {
    throw new UnsupportedFileError(
      `지원하지 않는 파일입니다: ${file.name}. 현재 지원: 업비트 PDF, 바이낸스 Spot CSV.`,
    );
  }
  return parser.parse(file);
}
