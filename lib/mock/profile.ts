// Mock profile + notification preferences.

export interface Profile {
  name: string;
  email: string;
  language: 'ko' | 'en';
}

export interface NotificationPrefs {
  email: boolean;
  transactionAdded: boolean;
  taxCalculated: boolean;
  payment: boolean;
  announcements: boolean;
}

const PROFILE_KEY = 'crypto-tax-profile';
const NOTIF_KEY = 'crypto-tax-notifications';

export function getProfile(fallback?: { name: string; email: string }): Profile {
  if (typeof window === 'undefined') {
    return { name: fallback?.name ?? '', email: fallback?.email ?? '', language: 'ko' };
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {}
  return {
    name: fallback?.name ?? '',
    email: fallback?.email ?? '',
    language: 'ko',
  };
}

export function updateProfile(profile: Profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

const defaultNotifs: NotificationPrefs = {
  email: true,
  transactionAdded: true,
  taxCalculated: true,
  payment: true,
  announcements: false,
};

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return defaultNotifs;
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return { ...defaultNotifs, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {}
  return defaultNotifs;
}

export function updateNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
}
