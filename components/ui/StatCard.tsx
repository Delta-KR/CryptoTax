import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'good' | 'bad';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}

const tones: Record<Tone, { bg: string; border: string; value: string }> = {
  neutral: {
    bg: 'bg-card',
    border: 'border-line',
    value: 'text-ink',
  },
  brand: {
    bg: 'bg-brand-faint',
    border: 'border-brand/20',
    value: 'text-brand',
  },
  good: {
    bg: 'bg-card',
    border: 'border-line',
    value: 'text-good',
  },
  bad: {
    bg: 'bg-card',
    border: 'border-line',
    value: 'text-bad',
  },
};

export function StatCard({ label, value, sub, tone = 'neutral', icon, className }: StatCardProps) {
  const t = tones[tone];
  return (
    <div
      className={cn(
        'rounded-lg border p-5 shadow-sm',
        t.bg,
        t.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="nowrap text-[12px] font-medium text-muted">{label}</div>
        {icon && <div className="text-muted-2">{icon}</div>}
      </div>
      <div className={cn('num nowrap mt-2 text-[24px] font-extrabold tracking-tighter2', t.value)}>
        {value}
      </div>
      {sub && (
        <div className="nowrap mt-1 text-[11px] text-muted-2">{sub}</div>
      )}
    </div>
  );
}
