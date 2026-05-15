import { z } from 'zod';

// Server Action 입력 캡. PDF·CSV 파싱이 메모리·CPU 무한 소비하는 것을 방어.
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB aggregate
export const MAX_FILES = 20;
export const MAX_PREV_STRING = 5 * 1024 * 1024; // 5MB JSON
export const MAX_PREV_ENTRIES = 10_000;

// 일부 브라우저는 `.pdf`에 `application/pdf` 대신 `application/octet-stream` 또는 빈 문자열을 줌.
// extension 체크와 함께 fallback.
export const ALLOWED_MIME = new Set<string>([
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
  '',
]);
export const ALLOWED_EXT = /\.(pdf|csv)$/i;

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export function validateFileList(files: File[]): FileValidationResult {
  if (files.length === 0) {
    return { ok: false, error: '파일이 첨부되지 않았습니다.' };
  }
  if (files.length > MAX_FILES) {
    return {
      ok: false,
      error: `한 번에 업로드할 수 있는 파일은 ${MAX_FILES}개까지입니다.`,
    };
  }
  let totalBytes = 0;
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        error: `파일이 너무 큽니다 (${f.name}): 개당 ${MAX_FILE_BYTES / 1024 / 1024}MB 이하만 가능합니다.`,
      };
    }
    if (!ALLOWED_MIME.has(f.type) && !ALLOWED_EXT.test(f.name)) {
      return {
        ok: false,
        error: `지원하지 않는 파일 형식입니다 (${f.name}). PDF 또는 CSV만 가능합니다.`,
      };
    }
    totalBytes += f.size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: `전체 파일 크기가 너무 큽니다. 합계 ${MAX_TOTAL_BYTES / 1024 / 1024}MB 이하만 가능합니다.`,
    };
  }
  return { ok: true };
}

const moneyOrCount = z.number().finite().min(-1e15).max(1e15);
const coinName = z.string().min(1).max(16).regex(/^[A-Za-z0-9_-]+$/);
const exchangeName = z.string().min(1).max(32);
const currency = z.string().min(1).max(16);
const isoDate = z.string().datetime({ offset: true });

export const parsedTransactionSchema = z.object({
  id: z.string().min(1).max(64),
  date: isoDate,
  type: z.enum(['BUY', 'SELL']),
  coin: coinName,
  amount: moneyOrCount,
  pricePerUnit: moneyOrCount,
  total: moneyOrCount,
  fee: moneyOrCount,
  exchange: exchangeName,
  quoteCurrency: currency,
  feeCurrency: currency,
  isSwap: z.boolean().optional(),
});

export const previousParsedSchema = z
  .array(parsedTransactionSchema)
  .max(MAX_PREV_ENTRIES);

export type PreviousParsed = z.infer<typeof previousParsedSchema>;
