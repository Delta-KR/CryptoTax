import { v4 as uuid } from 'uuid';
import type { ParsedTransaction } from '@/lib/engine/types';
import { type ExchangeParser, ParseError } from './parser.interface';

type PDFParseClass = new (options: { data: Uint8Array }) => {
  getText(): Promise<{ text: string }>;
  destroy(): Promise<void>;
};

const DATE_LINE = /^(\d{4})\.(\d{2})\.(\d{2})$/;
const TIME_LINE = /^(\d{2}):(\d{2})$/;
const NUMBER_UNIT = /^([\d,.]+)\s+([A-Z]+)/;

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

function parseNumberUnit(s: string): { value: number; unit: string } {
  const m = s.trim().match(NUMBER_UNIT);
  if (!m) throw new ParseError(`수치·단위 형식 오류: "${s}"`);
  const value = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(value)) throw new ParseError(`수치 파싱 실패: "${s}"`);
  return { value, unit: m[2] };
}

export function parseText(text: string): ParsedTransaction[] {
  const lines = text.split('\n').map((l) => l.trim());
  const txs: ParsedTransaction[] = [];

  let i = 0;
  while (i < lines.length) {
    if (!DATE_LINE.test(lines[i])) {
      i++;
      continue;
    }

    const dateStr = lines[i];
    if (i + 1 >= lines.length) break;

    const cells = lines[i + 1].split('\t').map((c) => c.trim());
    if (cells.length < 8) {
      i += 1;
      continue;
    }

    const timeStr = cells[0];
    const coin = cells[1];
    const kind = cells[3];

    if (kind === '입금' || kind === '출금') {
      i += 2;
      continue;
    }

    if (kind !== '매수' && kind !== '매도') {
      throw new ParseError(`알 수 없는 종류: "${kind}" (행 ${i + 2})`);
    }

    const amount = parseNumberUnit(cells[4]);
    const price = parseNumberUnit(cells[5]);
    const total = parseNumberUnit(cells[6]);
    const fee = parseNumberUnit(cells[7]);

    if (amount.unit !== coin) {
      throw new ParseError(
        `거래수량 단위 ${amount.unit} ≠ 코인 ${coin} (행 ${i + 2})`,
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

    i += 2;
    if (i < lines.length && TIME_LINE.test(lines[i])) {
      i += 1;
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
    let buf: Uint8Array;
    try {
      buf = new Uint8Array(await file.arrayBuffer());
    } catch (e) {
      throw new ParseError(
        `PDF 파일 읽기 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }

    let PDFParse: PDFParseClass;
    try {
      const mod = (await import('pdf-parse')) as { PDFParse: PDFParseClass };
      PDFParse = mod.PDFParse;
    } catch (e) {
      throw new ParseError(
        `pdf-parse 모듈 로드 실패 (Vercel 런타임 호환성): ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }

    let parser: InstanceType<PDFParseClass>;
    try {
      parser = new PDFParse({ data: buf });
    } catch (e) {
      throw new ParseError(
        `PDF 파서 초기화 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    }

    try {
      const result = await parser.getText();
      return parseText(result.text);
    } catch (e) {
      throw new ParseError(
        `PDF 텍스트 추출 실패: ${e instanceof Error ? e.message : String(e)}`,
        e,
      );
    } finally {
      try {
        await parser.destroy();
      } catch {
        // ignore destroy errors
      }
    }
  },
};
