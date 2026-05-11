// Mock auth — localStorage 기반 dummy 인증. 백엔드 없음.
// 모든 자격증명 입력은 success 처리 (시연용).

const KEY = 'crypto-tax-user';

export interface User {
  id: string;
  name: string;
  email: string;
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return null;
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function signIn(email: string, _password: string): User {
  const user: User = {
    id: 'u_mock',
    name: email.split('@')[0] || '사용자',
    email,
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function signUp(name: string, email: string, _password: string): User {
  const user: User = {
    id: 'u_mock',
    name: name || email.split('@')[0] || '사용자',
    email,
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function signOut() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
