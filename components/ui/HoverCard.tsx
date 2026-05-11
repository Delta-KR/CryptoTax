import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Reusable .hov wrapper. Adds three behaviors via app/globals.css `.hov`:
//   - 220px pointer-tracked brand spotlight (driven by PointerSpotlight)
//   - lift on hover (translateY(-3px))
//   - inner brand-tinted border + theme-specific shadow on hover
//
// Consumers supply their own border/background/shadow via className. The
// wrapper is intentionally unopinionated so it composes with any card style.
export function HoverCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('hov', className)} {...props}>
      {children}
    </div>
  );
}
