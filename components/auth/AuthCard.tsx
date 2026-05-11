import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn('w-full max-w-[420px]', className)}>
      <div className="rounded-lg border border-line bg-card p-8 shadow-md">
        <h1 className="text-[24px] font-extrabold tracking-tighter3 text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-body text-muted">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <div className="mt-5 text-center text-[13px] text-muted">{footer}</div>
      )}
    </div>
  );
}

// Visual divider with center text — used between primary form and social buttons.
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line-2" />
      <span className="text-[12px] text-muted-2">{label}</span>
      <span className="h-px flex-1 bg-line-2" />
    </div>
  );
}
