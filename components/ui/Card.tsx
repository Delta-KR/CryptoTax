import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Surface = 'card' | 'card-2' | 'soft';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  surface?: Surface;
}

const pads: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const surfaces: Record<Surface, string> = {
  card: 'bg-card',
  'card-2': 'bg-card-2',
  soft: 'bg-bg-soft',
};

export function Card({
  padding = 'md',
  surface = 'card',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line shadow-sm',
        surfaces[surface],
        pads[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
