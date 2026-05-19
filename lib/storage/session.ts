import { z } from 'zod';
import { reportRequestSchema } from '@/lib/validation/report';
import type {
  CalculatePayload,
  ParsedTransactionWire,
  TaxMethodWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';

const KEY = 'kontaxt-session-v1';

export interface SessionData {
  allParsed: ParsedTransactionWire[];
  allUnified: UnifiedTransactionWire[];
  result: TaxResultWire;
  year: number;
  method: TaxMethodWire;
  uploads: Array<{
    fileName: string;
    exchange: string;
    txCount: number;
    uploadedAt: string;
  }>;
}

// localStorage는 XSS 또는 사용자 손상 시 임의 데이터가 들어올 수 있음.
// 서버 검증 스키마를 재사용해 corrupted/주입 데이터를 격리.
const sessionSchema = z.object({
  allParsed: z.array(z.record(z.unknown())).max(50_000),
  allUnified: reportRequestSchema.shape.transactions,
  result: reportRequestSchema.shape.result,
  year: z.number().int().min(2020).max(2030),
  // 구버전 세션 호환: method 누락 시 'fifo'로 기본값 처리 (loadSession에서 보강).
  method: z.enum(['fifo', 'avg']).optional(),
  uploads: z
    .array(
      z.object({
        fileName: z.string().max(255),
        exchange: z.string().max(32),
        txCount: z.number().int().min(0).max(100_000),
        uploadedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
      }),
    )
    .max(100),
});

export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = sessionSchema.safeParse(parsed);
    if (!validated.success) {
      // 손상된 데이터는 제거해 무한 실패 방지.
      console.warn('[session] corrupted localStorage data, clearing.');
      localStorage.removeItem(KEY);
      return null;
    }
    // 구버전 세션(method 미보유) 호환: 기본 'fifo' 보강.
    return {
      ...(validated.data as unknown as Omit<SessionData, 'method'>),
      method: validated.data.method ?? 'fifo',
    } as SessionData;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // QuotaExceededError 등 — 무시.
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function appendUpload(
  payload: CalculatePayload,
  fileName: string,
): SessionData {
  const previous = loadSession();
  const exchange = payload.newParsed[0]?.exchange ?? 'Unknown';
  const upload = {
    fileName,
    exchange,
    txCount: payload.newParsed.length,
    uploadedAt: new Date().toISOString(),
  };
  const next: SessionData = {
    allParsed: payload.allParsed,
    allUnified: payload.allUnified,
    result: payload.result,
    year: payload.year,
    method: payload.method,
    uploads: [...(previous?.uploads ?? []), upload],
  };
  saveSession(next);
  return next;
}

// 토글 재계산 — 신규 파일 없이 method만 바꿔 결과 갱신.
export function replaceCalculation(
  payload: CalculatePayload,
): SessionData {
  const previous = loadSession();
  const next: SessionData = {
    allParsed: payload.allParsed,
    allUnified: payload.allUnified,
    result: payload.result,
    year: payload.year,
    method: payload.method,
    uploads: previous?.uploads ?? [],
  };
  saveSession(next);
  return next;
}
