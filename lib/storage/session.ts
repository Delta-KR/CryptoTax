import { z } from 'zod';
import { reportRequestSchema } from '@/lib/validation/report';
import type {
  CalculatePayload,
  ParsedTransactionWire,
  TaxMethodWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';

// 거래 데이터는 현재 localStorage 보관 (Phase 7 결제 출시 후 DB 이전 예정).
// 같은 브라우저에서 계정 전환 시 데이터 섞임 방지를 위해 user_id 별로 키 분리.
//
// - 로그인 시: `kontaxt-session-v1-${userId}` — 본인 데이터 격리
// - 비로그인 시: `kontaxt-session-v1-anon` — 데모/시연용
//
// setSessionUser() 는 useCurrentUser hook 의 auth state listener 에서 호출.
// SSR 환경에선 currentUserId 가 항상 null (server context).

const KEY_PREFIX = 'kontaxt-session-v1';
const ANON_KEY = `${KEY_PREFIX}-anon`;

let currentUserId: string | null = null;

export function setSessionUser(userId: string | null): void {
  currentUserId = userId;
}

function getKey(): string {
  return currentUserId ? `${KEY_PREFIX}-${currentUserId}` : ANON_KEY;
}

/**
 * 구버전 단일 키(`kontaxt-session-v1`) 데이터가 남아있는 경우 — 사용자
 * 격리 안 된 잠재적 누출 데이터. 새 키 체계 도입(2026-05-23) 후 첫 로드 시
 * 무조건 제거. 사용자 본인이 가입 전 입력한 데이터는 안타깝지만 보안 우선.
 */
function purgeLegacyKey(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(KEY_PREFIX) !== null) {
      localStorage.removeItem(KEY_PREFIX);
    }
  } catch {
    // private mode 등 — 무시.
  }
}

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
  // 구버전 세션 호환: method 누락 시 'totalAverage'로 기본값 처리 (loadSession에서 보강).
  // 시행령 §88① 거주자 총평균법이 디폴트. 'fifo'/'avg'는 구세션 또는 비거주자 모드 호환.
  method: z.enum(['totalAverage', 'fifo', 'avg']).optional(),
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
    purgeLegacyKey();
    const raw = localStorage.getItem(getKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = sessionSchema.safeParse(parsed);
    if (!validated.success) {
      // 손상된 데이터는 제거해 무한 실패 방지.
      console.warn('[session] corrupted localStorage data, clearing.');
      localStorage.removeItem(getKey());
      return null;
    }
    // 구버전 세션(method 미보유) 호환: 거주자 디폴트 'totalAverage' 보강.
    return {
      ...(validated.data as unknown as Omit<SessionData, 'method'>),
      method: validated.data.method ?? 'totalAverage',
    } as SessionData;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getKey(), JSON.stringify(data));
  } catch {
    // QuotaExceededError 등 — 무시.
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getKey());
}

/**
 * 로그아웃 시 호출 — 현재 user 키와 anon 키 모두 정리.
 * 다음 사용자 (또는 본인 재로그인 전 anonymous 상태) 가 이전 데이터를 보지
 * 않도록.
 */
export function clearAllSessions(): void {
  if (typeof window === 'undefined') return;
  try {
    purgeLegacyKey();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // 무시.
  }
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
