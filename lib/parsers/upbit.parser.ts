import { v4 as uuid } from 'uuid';
import type { ParsedTransaction } from '@/lib/engine/types';
import {
  type ExchangeParser,
  ParseError,
  UnsupportedFileError,
} from './parser.interface';

// 업비트 거래내역 PDF가 맞는지 텍스트에서 검증. 무관한 PDF(이용동의서·계약서·영수증 등)는 거부.
// "거래내역" / "Upbit" / "체결시간" 등 한국 업비트 PDF의 흔한 키워드 하나라도 있으면 통과.
const UPBIT_SIGNATURES = [
  '업비트',
  'Upbit',
  'UPBIT',
  '체결시간',
  '주문시간',
  '거래수량',
  '거래단가',
  '거래금액',
];

export function looksLikeUpbitTransactionPdf(text: string): boolean {
  return UPBIT_SIGNATURES.some((s) => text.includes(s));
}

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

    let text: string;
    try {
      const data = await pdf(buf);
      text = data.text ?? '';
    } catch (e) {
      throw new ParseError(
        `PDF 텍스트 추출 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }

    // 시그니처 검증: 업비트 거래내역 PDF가 아니면 즉시 거부 (이용동의서·영수증 등 차단).
    if (!looksLikeUpbitTransactionPdf(text)) {
      throw new UnsupportedFileError(
        "업비트 거래내역 PDF가 아닙니다. 업비트 웹사이트 → 거래내역 → 양도소득 → PDF 다운로드 메뉴에서 받은 파일을 업로드해주세요. (이용동의서·영수증·계약서 등은 처리할 수 없습니다.)",
      );
    }

    const txs = parseText(text);

    // 시그니처는 있는데 거래 행이 하나도 없는 경우 — 잘못된 양식이거나 빈 기간 PDF.
    if (txs.length === 0) {
      throw new ParseError(
        '업비트 PDF에서 거래 행을 찾을 수 없습니다. 양도소득 메뉴에서 받은 PDF인지, 해당 기간에 거래가 있는지 확인해주세요.',
      );
    }

    return txs;
  },
};
