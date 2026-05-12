import { v4 as uuid } from 'uuid';
import type { ParsedTransaction } from '@/lib/engine/types';
import { type ExchangeParser, ParseError } from './parser.interface';

type PdfParseFn = (
  buffer: Buffer,
) => Promise<{ text: string; numpages: number }>;

const DATE_LINE = /^(\d{4})\.(\d{2})\.(\d{2})$/;
const TIME_LINE = /^(\d{2}):(\d{2})$/;
// Data row: {coin}{market: '-' or letters}{kind}{rest}
// Upbit row: {coin: any letters/digits}{market: '-' or 'KRW' or 'BTC' or 'USDT' or 'USDC'}{kind}{rest}
const ROW_REGEX =
  /^([A-Z][A-Z0-9]*?)(-|KRW|BTC|USDT|USDC)(매수|매도|입금|출금)(.+)$/;
const NUMBER_UNIT_GLOBAL = /(\d[\d,.]*)([A-Z]+)/g;

function parseDateTime(dateStr: string, timeStr: string): Date {
  const dm = dateStr.match(DATE_LINE);
  const tm = timeStr.match(TIME_LINE);
  if (!dm || !tm) {
    throw new ParseError(`날짜·시각 파싱 실패: "${dateStr}" "${timeStr}"`);
  }
  return new Date(
    `${dm[1]}-${dm[2]}-${dm[3]}T${tm[1]}:${tm[2]}:00+09:00`,
  );
}

interface NumUnit {
  value: number;
  unit: string;
}

function extractPairs(s: string): NumUnit[] {
  const pairs: NumUnit[] = [];
  NUMBER_UNIT_GLOBAL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBER_UNIT_GLOBAL.exec(s)) !== null) {
    const v = parseFloat(m[1].replace(/,/g, ''));
    if (Number.isNaN(v)) continue;
    pairs.push({ value: v, unit: m[2] });
  }
  return pairs;
}

export function parseText(text: string): ParsedTransaction[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const txs: ParsedTransaction[] = [];

  let i = 0;
  while (i < lines.length) {
    if (!DATE_LINE.test(lines[i])) {
      i++;
      continue;
    }

    if (i + 2 >= lines.length) break;
    if (!TIME_LINE.test(lines[i + 1])) {
      i++;
      continue;
    }

    const dateStr = lines[i];
    const timeStr = lines[i + 1];
    const dataLine = lines[i + 2];

    const match = dataLine.match(ROW_REGEX);
    if (!match) {
      i++;
      continue;
    }

    const coin = match[1];
    const kind = match[3];
    const rest = match[4];

    if (kind === '입금' || kind === '출금') {
      i += 3;
      continue;
    }

    if (kind !== '매수' && kind !== '매도') {
      throw new ParseError(`알 수 없는 종류: "${kind}"`);
    }

    const pairs = extractPairs(rest);
    if (pairs.length < 4) {
      throw new ParseError(
        `행 형식 오류 (수치 4개 미만): "${dataLine}"`,
      );
    }

    const [amount, price, total, fee] = pairs;
    if (amount.unit !== coin) {
      throw new ParseError(
        `거래수량 단위 ${amount.unit} ≠ 코인 ${coin}`,
      );
    }

    txs.push({
      id: uuid(),
      date: parseDateTime(dateStr, timeStr),
      type: kind === '매수' ? 'BUY' : 'SELL',
      coin,
      amount: amount.value,
      pricePerUnit: price.value,
      total: total.value,
      fee: fee.value,
      exchange: 'Upbit',
      quoteCurrency: price.unit,
      feeCurrency: fee.unit,
    });

    // 매수/매도는 주문시간 date+time이 뒤따름 → 추가 2줄 스킵
    i += 3;
    if (i + 1 < lines.length && DATE_LINE.test(lines[i]) && TIME_LINE.test(lines[i + 1])) {
      // 다음 행 시작인지 주문시간인지 구분: 그 다음 줄이 data row인지 확인
      // 주문시간이면 그 뒤에 또 date가 나오거나 끝남
      // 다음 체결시간이면 그 뒤에 data row가 나옴
      // 간단히: 주문시간 가능성 우선해서 스킵 (Upbit 매수/매도는 항상 주문시간 있음)
      const after = i + 2 < lines.length ? lines[i + 2] : '';
      const isNextChegyeol =
        ROW_REGEX.test(after);
      if (!isNextChegyeol) {
        i += 2;
      }
    }
  }

  return txs;
}

export const upbitParser: ExchangeParser = {
  id: 'upbit',
  name: '업비트',
  extensions: ['.pdf'],
  canParse(filename) {
    return filename.toLowerCase().endsWith('.pdf');
  },
  async parse(file: File): Promise<ParsedTransaction[]> {
    let buf: Buffer;
    try {
      buf = Buffer.from(await file.arrayBuffer());
    } catch (e) {
      throw new ParseError(
        `PDF 파일 읽기 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }

    let pdf: PdfParseFn;
    try {
      const mod = (await import('pdf-parse')) as
        | { default: PdfParseFn }
        | PdfParseFn;
      pdf = (typeof mod === 'function' ? mod : mod.default) as PdfParseFn;
    } catch (e) {
      throw new ParseError(
        `pdf-parse 모듈 로드 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }

    try {
      const data = await pdf(buf);
      return parseText(data.text);
    } catch (e) {
      throw new ParseError(
        `PDF 텍스트 추출 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }
  },
};
