import { describe, expect, it } from 'vitest';
import {
  OAUTH_PROVIDERS,
  hasEmailIdentity,
  isProviderLinked,
} from '@/lib/auth/oauth-providers';

describe('isProviderLinked', () => {
  it('returns true when identities[].provider matches', () => {
    const user = { identities: [{ provider: 'google' }, { provider: 'email' }] };
    expect(isProviderLinked(user, 'google')).toBe(true);
    expect(isProviderLinked(user, 'naver')).toBe(false);
    expect(isProviderLinked(user, 'kakao')).toBe(false);
  });

  it('returns true when app_metadata.providers[] contains provider', () => {
    const user = { app_metadata: { providers: ['naver', 'email'] } };
    expect(isProviderLinked(user, 'naver')).toBe(true);
    expect(isProviderLinked(user, 'google')).toBe(false);
  });

  it('returns true when app_metadata.provider matches (admin.updateUserById path)', () => {
    const user = { app_metadata: { provider: 'naver' } };
    expect(isProviderLinked(user, 'naver')).toBe(true);
  });

  it('returns true when user_metadata.provider matches (admin.generateLink data path)', () => {
    // 2026-05-26 관측 — Supabase verify 단계에서 app_metadata.provider 가
    // 'email' 로 reset 되는 케이스. user_metadata.provider 는 살아남음.
    const user = {
      identities: [{ provider: 'email' }],
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { provider: 'naver' },
    };
    expect(isProviderLinked(user, 'naver')).toBe(true);
  });

  it('returns false when no source matches', () => {
    const user = {
      identities: [{ provider: 'email' }],
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { provider: 'email' },
    };
    expect(isProviderLinked(user, 'naver')).toBe(false);
    expect(isProviderLinked(user, 'google')).toBe(false);
    expect(isProviderLinked(user, 'kakao')).toBe(false);
  });

  it('handles missing fields gracefully (null / undefined)', () => {
    expect(isProviderLinked({}, 'naver')).toBe(false);
    expect(isProviderLinked({ identities: null }, 'naver')).toBe(false);
    expect(isProviderLinked({ app_metadata: null }, 'naver')).toBe(false);
    expect(isProviderLinked({ user_metadata: null }, 'naver')).toBe(false);
  });

  it('covers all OAUTH_PROVIDERS entries', () => {
    // 신규 provider 추가 시 helper 가 자동 동작 — list 만 갱신
    for (const p of OAUTH_PROVIDERS) {
      const user = { app_metadata: { provider: p } };
      expect(isProviderLinked(user, p)).toBe(true);
    }
  });
});

describe('hasEmailIdentity (uses isProviderLinked internally)', () => {
  it('returns false when any OAuth provider is linked (any of 4 sources)', () => {
    expect(hasEmailIdentity({ user_metadata: { provider: 'naver' } })).toBe(false);
    expect(hasEmailIdentity({ app_metadata: { provider: 'google' } })).toBe(false);
    expect(
      hasEmailIdentity({ app_metadata: { providers: ['kakao'] } }),
    ).toBe(false);
    expect(
      hasEmailIdentity({ identities: [{ provider: 'naver' }] }),
    ).toBe(false);
  });

  it('returns true when only email identity present', () => {
    const user = {
      identities: [{ provider: 'email' }],
      app_metadata: { providers: ['email'] },
    };
    expect(hasEmailIdentity(user)).toBe(true);
  });

  it('returns false when no email and no OAuth provider (corner case)', () => {
    expect(hasEmailIdentity({})).toBe(false);
    expect(hasEmailIdentity({ identities: [] })).toBe(false);
  });

  it('OAuth-only case — Naver user with fake email identity (admin.generateLink)', () => {
    // admin.generateLink 가 첫 가입자에게 identities='email' fake row 박는
    // Supabase 한계. user_metadata.provider='naver' 가 진짜 신호 source.
    const user = {
      identities: [{ provider: 'email' }],
      user_metadata: { provider: 'naver' },
    };
    expect(hasEmailIdentity(user)).toBe(false);
  });
});
