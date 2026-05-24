// 알림 설정 — Phase 7 알림 인프라 통합 전까지 localStorage에 보관.

export interface NotificationPrefs {
  email: boolean;
  transactionAdded: boolean;
  taxCalculated: boolean;
  payment: boolean;
  announcements: boolean;
}

const NOTIF_KEY = 'kontaxt-notifications';

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
    if (raw)
      return { ...defaultNotifs, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {}
  return defaultNotifs;
}

export function updateNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
}
