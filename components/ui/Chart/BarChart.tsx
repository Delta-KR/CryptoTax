import { cn } from '@/lib/utils';

export interface BarItem {
  label: string;
  value: number;
  color?: string; // Tailwind/CSS color override
  gain?: boolean; // true = green gradient, false = red gradient
}

interface BarChartProps {
  items: BarItem[];
  formatter?: (n: number) => string;
  labelWidth?: number; // px
  valueWidth?: number; // px
  className?: string;
}

const defaultFormatter = (n: number) => n.toLocaleString();

export function BarChart({
  items,
  formatter = defaultFormatter,
  labelWidth = 56,
  valueWidth = 110,
  className,
}: BarChartProps) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => {
        const pct = Math.max(2, (Math.abs(item.value) / max) * 100);
        const gain = item.gain ?? item.value >= 0;
        const gradient = item.color
          ? item.color
          : gain
            ? 'linear-gradient(90deg, #60A5FA, rgb(var(--brand)))'
            : 'linear-gradient(90deg, #FCA5A5, rgb(var(--bad)))';
        return (
          <div
            key={item.label}
            className="grid items-center gap-3"
            style={{
              gridTemplateColumns: `${labelWidth}px 1fr ${valueWidth}px`,
            }}
          >
            <div className="nowrap text-[13px] font-semibold text-ink-2">
              {item.label}
            </div>
            <div className="relative h-2.5 rounded-[6px] border border-line-2 bg-bg-tint">
              <div
                className="absolute inset-y-0 left-0 rounded-[6px]"
                style={{
                  width: `${pct}%`,
                  background: gradient,
                }}
              />
            </div>
            <div
              className={cn(
                'num nowrap text-right text-[13px] font-semibold',
                gain ? 'text-good' : 'text-bad'
              )}
            >
              {formatter(item.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
