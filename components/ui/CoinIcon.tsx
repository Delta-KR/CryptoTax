import Image from 'next/image';
import { cn } from '@/lib/utils';

const knownCoins = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'DOGE']);

// Fallback brand colors for coins not yet bundled (또는 SVG 로딩 실패 시 backup)
const coinColors: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  XRP: '#23292F',
  DOGE: '#C2A633',
};

interface CoinIconProps {
  coin: string;
  size?: number;
  className?: string;
}

export function CoinIcon({ coin, size = 24, className }: CoinIconProps) {
  const sym = coin.toUpperCase();

  if (knownCoins.has(sym)) {
    return (
      <Image
        src={`/logos/coins/${sym.toLowerCase()}.svg`}
        alt={sym}
        width={size}
        height={size}
        className={cn('inline-block flex-shrink-0', className)}
      />
    );
  }

  // 미등록 코인 — 색 letter circle 폴백
  return (
    <span
      className={cn(
        'inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold',
        className
      )}
      style={{
        width: size,
        height: size,
        background: `${coinColors[sym] ?? '#888'}18`,
        color: coinColors[sym] ?? 'rgb(var(--ink))',
        fontSize: Math.max(8, Math.round(size * 0.42)),
      }}
    >
      {sym.slice(0, 1)}
    </span>
  );
}
