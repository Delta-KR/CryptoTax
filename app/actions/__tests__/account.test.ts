import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Server Action 핵심 보안 속성 검증:
// (a) userId는 항상 getUser()에서 추출 — args 신뢰 X
// (b) getUser() null이면 fail
// (c) admin.deleteUser 전에 anon client signOut 호출

const getUserMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const updateUserMock = vi.fn();
const signOutMock = vi.fn();
const adminDeleteUserMock = vi.fn();
const profilesDeleteEqMock = vi.fn();
const redirectMock = vi.fn();

let callOrder: string[] = [];

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    callOrder.push('redirect');
    redirectMock(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: () => Promise.resolve(getUserMock()),
      signInWithPassword: (...args: unknown[]) => {
        callOrder.push('signInWithPassword');
        return Promise.resolve(signInWithPasswordMock(...args));
      },
      updateUser: (...args: unknown[]) => {
        callOrder.push('updateUser');
        return Promise.resolve(updateUserMock(...args));
      },
      signOut: () => {
        callOrder.push('signOut');
        return Promise.resolve(signOutMock());
      },
    },
  }),
  createSupabaseAdminClient: () => ({
    from: () => ({
      delete: () => ({
        eq: (...args: unknown[]) => {
          callOrder.push('profiles.delete');
          return Promise.resolve(profilesDeleteEqMock(...args));
        },
      }),
    }),
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) => {
          callOrder.push('admin.deleteUser');
          return Promise.resolve(adminDeleteUserMock(...args));
        },
      },
    },
  }),
}));

import {
  changePassword,
  deleteAccount,
  updateDisplayName,
} from '../account';

beforeEach(() => {
  callOrder = [];
  getUserMock.mockReset();
  signInWithPasswordMock.mockReset();
  updateUserMock.mockReset();
  signOutMock.mockReset();
  adminDeleteUserMock.mockReset();
  profilesDeleteEqMock.mockReset();
  redirectMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('changePassword', () => {
  it('fails when user is not authenticated', async () => {
    getUserMock.mockReturnValue({ data: { user: null } });
    const r = await changePassword({ oldPassword: 'old', newPassword: 'Aa1!aaaaaaaa' });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('unauthenticated');
  });

  it('rejects OAuth-only accounts', async () => {
    getUserMock.mockReturnValue({
      data: {
        user: {
          id: 'u',
          email: 'x@x.com',
          app_metadata: { providers: ['google'] },
        },
      },
    });
    const r = await changePassword({ oldPassword: 'x', newPassword: 'Aa1!aaaaaaaa' });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('oauth_only');
  });

  it('rejects weak new password', async () => {
    getUserMock.mockReturnValue({
      data: {
        user: {
          id: 'u',
          email: 'x@x.com',
          app_metadata: { providers: ['email'] },
        },
      },
    });
    const r = await changePassword({ oldPassword: 'x', newPassword: 'weak' });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('weak');
  });

  it('rejects wrong old password (re-auth fails)', async () => {
    getUserMock.mockReturnValue({
      data: {
        user: {
          id: 'u',
          email: 'x@x.com',
          app_metadata: { providers: ['email'] },
        },
      },
    });
    signInWithPasswordMock.mockReturnValue({ error: { message: 'Invalid' } });
    const r = await changePassword({
      oldPassword: 'bad',
      newPassword: 'Aa1!aaaaaaaa',
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('wrong_password');
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('succeeds when re-auth + updateUser succeed', async () => {
    getUserMock.mockReturnValue({
      data: {
        user: {
          id: 'u',
          email: 'x@x.com',
          app_metadata: { providers: ['email'] },
        },
      },
    });
    signInWithPasswordMock.mockReturnValue({ error: null });
    updateUserMock.mockReturnValue({ error: null });
    const r = await changePassword({
      oldPassword: 'old',
      newPassword: 'Aa1!aaaaaaaa',
    });
    expect(r.ok).toBe(true);
    expect(callOrder).toEqual(['signInWithPassword', 'updateUser']);
  });
});

describe('updateDisplayName', () => {
  it('rejects empty name', async () => {
    getUserMock.mockReturnValue({ data: { user: { id: 'u' } } });
    expect((await updateDisplayName('   ')).ok).toBe(false);
  });

  it('rejects name longer than 50 chars', async () => {
    getUserMock.mockReturnValue({ data: { user: { id: 'u' } } });
    expect((await updateDisplayName('a'.repeat(51))).ok).toBe(false);
  });

  it('requires authentication', async () => {
    getUserMock.mockReturnValue({ data: { user: null } });
    expect((await updateDisplayName('Alice')).ok).toBe(false);
  });

  it('calls updateUser with trimmed name when authed', async () => {
    getUserMock.mockReturnValue({ data: { user: { id: 'u' } } });
    updateUserMock.mockReturnValue({ error: null });
    const r = await updateDisplayName('  Alice  ');
    expect(r.ok).toBe(true);
    expect(updateUserMock).toHaveBeenCalledWith({ data: { name: 'Alice' } });
  });
});

describe('deleteAccount', () => {
  it('requires authentication', async () => {
    getUserMock.mockReturnValue({ data: { user: null } });
    const r = await deleteAccount();
    expect(r.ok).toBe(false);
    expect(adminDeleteUserMock).not.toHaveBeenCalled();
  });

  it('deletes profiles row before admin.deleteUser, with signOut in between', async () => {
    getUserMock.mockReturnValue({ data: { user: { id: 'user-id-from-session' } } });
    profilesDeleteEqMock.mockReturnValue({ error: null });
    adminDeleteUserMock.mockReturnValue({ error: null });
    signOutMock.mockReturnValue(undefined);
    try {
      await deleteAccount();
    } catch (e) {
      // redirect() throws NEXT_REDIRECT — expected.
      expect((e as Error).message).toBe('NEXT_REDIRECT');
    }
    expect(callOrder).toEqual([
      'profiles.delete',
      'signOut',
      'admin.deleteUser',
      'redirect',
    ]);
    // userId always from getUser(), never from args.
    expect(adminDeleteUserMock).toHaveBeenCalledWith('user-id-from-session');
  });

  it('returns error if admin.deleteUser fails', async () => {
    getUserMock.mockReturnValue({ data: { user: { id: 'u' } } });
    profilesDeleteEqMock.mockReturnValue({ error: null });
    adminDeleteUserMock.mockReturnValue({ error: { message: 'admin down' } });
    const r = await deleteAccount();
    expect(r.ok).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
