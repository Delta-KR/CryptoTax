'use client';

import { createContext, useContext } from 'react';
import { useCurrentUser, type User } from '@/lib/auth';

type UserContextValue = { user: User | null; loading: boolean };

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
});

/**
 * Single useCurrentUser subscription scoped to AppShell.
 * Child pages consume via useUserContext to avoid duplicate Supabase
 * onAuthStateChange listeners and redundant loadSnapshot side-effects.
 *
 * audit perf P1-1 (2026-05-23): 이전엔 AppShell + 5 child page 가 각자
 * useCurrentUser 를 호출해서 페이지당 2× profile select + 2× loadSnapshot
 * (= 4× supabase round-trip) 이 발생. provider 1회 호출로 통합.
 */
export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useCurrentUser();
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  return useContext(UserContext);
}
