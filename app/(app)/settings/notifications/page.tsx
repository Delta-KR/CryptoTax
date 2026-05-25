'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '@/lib/client/notifications';

interface NotificationItem {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}

const items: NotificationItem[] = [
  {
    key: 'email',
    label: '이메일 알림 전체',
    description: '아래 항목 중 활성화된 알림이 이메일로 전송돼요.',
  },
  {
    key: 'transactionAdded',
    label: '거래 추가',
    description: '새로운 거래내역이 통합될 때 알림.',
  },
  {
    key: 'taxCalculated',
    label: '세금 계산 완료',
    description: '계산이 완료되거나 재계산되면 알림.',
  },
  {
    key: 'payment',
    label: '결제',
    description: '결제 성공/실패/환불 시 알림.',
  },
  {
    key: 'announcements',
    label: '공지 및 마케팅',
    description: '새 기능 출시, 이벤트, 세금 관련 공지.',
  },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    setPrefs(getNotificationPrefs());
  }, []);

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    updateNotificationPrefs(next);
    toast.show(`${items.find((i) => i.key === key)?.label} 설정 저장됨`, 'success');
  }

  return (
    <>
      <PageHeader
        title="알림 설정"
        description="원하는 알림만 받도록 세부 조정할 수 있어요."
      />

      <Card padding="none">
        <ul className="flex flex-col">
          {items.map((item, idx) => (
            <li
              key={item.key}
              className={
                'flex items-center justify-between gap-4 px-6 py-5 ' +
                (idx < items.length - 1 ? 'border-b border-line-2' : '')
              }
            >
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-ink">{item.label}</div>
                <div className="mt-0.5 text-[12px] text-muted">{item.description}</div>
              </div>
              <Switch
                checked={prefs?.[item.key] ?? false}
                onChange={(e) => toggle(item.key, e.target.checked)}
                aria-label={item.label}
              />
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-[12px] text-muted">
        변경사항은 자동으로 저장돼요.
      </p>
    </>
  );
}
