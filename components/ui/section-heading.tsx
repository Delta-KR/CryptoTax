import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Section header trio — eyebrow (brand uppercase), title (44/800 dark), lead
// (17/1.6 muted). Used by Problem, HowItWorks, Example, Exchanges, Features,
// Pricing, and CTA. Keep widths modest; long Korean copy benefits from
// `<br />` breaks the caller controls.

export function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3.5 text-eyebrow uppercase text-brand', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'max-w-[760px] text-[32px] font-extrabold leading-[1.18] tracking-tighter3 text-ink text-balance lg:text-[44px]',
        className
      )}
    >
      {children}
    </h2>
  );
}

export function SectionLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'mt-[18px] max-w-[620px] text-[17px] leading-[1.6] text-muted text-pretty',
        className
      )}
    >
      {children}
    </p>
  );
}
