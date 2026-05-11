import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Compact count / tag — smaller and less ornate than Pill.
export function Badge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-bg-tint px-1.5 py-0.5 text-[10px] font-semibold text-muted',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
