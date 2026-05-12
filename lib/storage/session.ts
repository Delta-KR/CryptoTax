import type {
  CalculatePayload,
  ParsedTransactionWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';

const KEY = 'crypto-tax-session-v1';

export interface SessionData {
  allParsed: ParsedTransactionWire[];
  allUnified: UnifiedTransactionWire[];
  result: TaxResultWire;
  year: number;
  uploads: Array<{
    fileName: string;
    exchange: string;
    txCount: number;
    uploadedAt: string;
  }>;
}

export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
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
  const exchange =
    payload.newParsed[0]?.exchange ?? 'Unknown';
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
    uploads: [...(previous?.uploads ?? []), upload],
  };
  saveSession(next);
  return next;
}
