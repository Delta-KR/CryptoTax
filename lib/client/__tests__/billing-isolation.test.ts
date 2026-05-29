import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getTaxProRequest,
  submitTaxProRequest,
  getPaymentHistory,
} from '@/lib/client/billing';
import {
  setSessionUser,
  clearAllSessions,
} from '@/lib/storage/session';

// localStorage / window 미니 목 — node env 에서 client 저장 모듈을 직접 테스트.
// (모듈들은 호출 시점에 global 을 읽으므로 beforeEach 설치로 충분.)
function installLocalStorageMock(): Map<string, string> {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
  };
  (globalThis as unknown as { window: unknown }).window = globalThis;
  (globalThis as unknown as { localStorage: unknown }).localStorage = ls;
  return store;
}

let store: Map<string, string>;

beforeEach(() => {
  store = installLocalStorageMock();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).localStorage;
  setSessionUser(null);
});

const PII = {
  name: '홍길동',
  contact: '010-1234-5678',
  preferredPeriod: '상반기',
  notes: '비공개 상담 내용',
};

describe('세무사 매칭 PII — 계정 간 격리 (CSO Finding 2)', () => {
  it('A 가 저장한 신청서를 B 는 읽지 못한다 (계정 전환 누출 차단)', () => {
    setSessionUser('user-A');
    submitTaxProRequest(PII);
    expect(getTaxProRequest()?.name).toBe('홍길동');

    // 같은 브라우저에서 계정 전환 (로그아웃 없이도).
    setSessionUser('user-B');
    expect(getTaxProRequest()).toBeNull();

    // A 로 돌아오면 본인 데이터는 그대로.
    setSessionUser('user-A');
    expect(getTaxProRequest()?.contact).toBe('010-1234-5678');
  });

  it('저장 키에 user_id 가 포함된다 (단일 고정 키 아님)', () => {
    setSessionUser('user-A');
    submitTaxProRequest(PII);
    expect(store.has('kontaxt-taxpro')).toBe(false); // 구 단일 키 사용 금지
    expect(store.has('kontaxt-taxpro-user-A')).toBe(true);
  });

  it('미인증(세션 user 없음) 시 PII 를 anon 공유 키에 쓰지 않는다', () => {
    setSessionUser(null);
    submitTaxProRequest(PII);
    // anon 공유 키는 모든 브라우저 사용자가 공유 → PII 저장 금지.
    expect(store.has('kontaxt-taxpro-anon')).toBe(false);
    // 미인증 조회는 어떤 PII 도 반환하지 않는다.
    expect(getTaxProRequest()).toBeNull();
    expect(getPaymentHistory()).toEqual([]);
  });

  it('구버전 단일 키(kontaxt-taxpro)는 접근 시 제거된다 (잔존 PII 정리)', () => {
    store.set('kontaxt-taxpro', JSON.stringify({ ...PII, id: 'x', status: '매칭 대기', submittedAt: '2026-01-01' }));
    setSessionUser('user-B');
    // B 의 스코핑 키엔 데이터 없음 + 레거시 단일 키는 purge.
    expect(getTaxProRequest()).toBeNull();
    expect(store.has('kontaxt-taxpro')).toBe(false);
  });
});

describe('clearAllSessions — 로그아웃 시 PII 키 정리', () => {
  it('taxpro / billing / 거래세션 키는 지우고, theme / migration 플래그는 보존', () => {
    setSessionUser('user-A');
    submitTaxProRequest(PII);
    store.set('kontaxt-session-v1-user-A', '{}');
    store.set('kontaxt-billing-history-user-A', '[]');
    store.set('kontaxt-notifications', '{}');
    store.set('kontaxt-theme', 'dark');
    store.set('kontaxt-migration-v1', 'done');

    clearAllSessions();

    expect(store.has('kontaxt-taxpro-user-A')).toBe(false);
    expect(store.has('kontaxt-session-v1-user-A')).toBe(false);
    expect(store.has('kontaxt-billing-history-user-A')).toBe(false);
    expect(store.has('kontaxt-notifications')).toBe(false);
    // 비-사용자 환경설정은 보존.
    expect(store.get('kontaxt-theme')).toBe('dark');
    expect(store.get('kontaxt-migration-v1')).toBe('done');
  });
});

describe('getPaymentHistory — 스코핑', () => {
  it('user 별 키에서만 읽고 구 단일 키는 무시·제거', () => {
    store.set('kontaxt-billing-history', JSON.stringify([{ id: '1' }]));
    setSessionUser('user-B');
    expect(getPaymentHistory()).toEqual([]);
    expect(store.has('kontaxt-billing-history')).toBe(false);
  });
});
