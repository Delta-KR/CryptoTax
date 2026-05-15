import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Reusable .hov wrapper — restrained hover (1px lift + border tightening).
// See app/globals.css `.hov`. Honors prefers-reduced-motion.
export function HoverCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('hov', className)} {...props}>
      {children}
    </div>
  );
}
