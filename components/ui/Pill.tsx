import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'good' | 'bad' | 'warn' | 'neutral';
type Size = 'sm' | 'md';

interface PillProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  leftIcon?: ReactNode;
  children: ReactNode;
}

const tones: Record<Tone, { bg: string; border: string; text: string; dot: string }> = {
  brand: {
    bg: 'bg-brand/[0.12]',
    border: 'border-brand/30',
    text: 'text-brand',
    dot: 'bg-brand',
  },
  good: {
    bg: 'bg-good-soft',
    border: 'border-good/40',
    text: 'text-good',
    dot: 'bg-good',
  },
  bad: {
    bg: 'bg-bad-soft',
    border: 'border-bad/40',
    text: 'text-bad',
    dot: 'bg-bad',
  },
  warn: {
    bg: 'bg-warn-soft',
    border: 'border-warn/40',
    text: 'text-warn',
    dot: 'bg-warn',
  },
  neutral: {
    bg: 'bg-bg-soft',
    border: 'border-line',
    text: 'text-ink-2',
    dot: 'bg-muted',
  },
};

const sizes: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-[12px]',
};

export function Pill({
  tone = 'neutral',
  size = 'md',
  dot,
  leftIcon,
  className,
  children,
  ...props
}: PillProps) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        'nowrap inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-[0.02em]',
        t.bg,
        t.border,
        t.text,
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', t.dot)} />}
      {leftIcon}
      {children}
    </span>
  );
}
