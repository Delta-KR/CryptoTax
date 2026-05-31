'use client';
import { useEffect, useState } from 'react';
import { getTransactions } from '@/lib/client/transactions';

// 결제 유도 동적 가치 — pricing-strategy §6.3.
//
// B-3 에서 납부세액은 blur 유지 결정(공격적 전환)이라, 세액 정확값을 노출하면
// paywall 이 깨진다. 그래서 세액 대신 (1) 거래량 매몰비용 (2) 가산세 리스크(율만)로
// 결제 동기를 만든다 — 정확한 세액 숫자는 결제 후. 가산세율은 국세기본법 §47의2·3
// (무신고 20% / 과소신고 10% / 부정 40%). 세무사 무관 (세무사법 §20 회피,
// [[feedback_no_tax_agent_framing]]).
//
// tone: PremiumBanner(brand 박스, 흰 텍스트) = 'onBrand' / checkout(Card) = 'default'.
// 거래내역이 없으면(getTransactions 빈 배열) 렌더하지 않는다.
export function ValueTeaser({ tone = 'default' }: { tone?: 'onBrand' | 'default' }) {
  const [stats, setStats] = useState<{ count: number; exchanges: number } | null>(
    null,
  );

  useEffect(() => {
    const txs = getTransactions();
    if (txs.length === 0) return;
    setStats({
      count: txs.length,
      exchanges: new Set(txs.map((t) => t.exchange)).size,
    });
  }, []);

  if (!stats) return null;

  const sunkColor = tone === 'onBrand' ? 'text-white' : 'text-ink';
  const subColor = tone === 'onBrand' ? 'text-white/80' : 'text-muted';
  const divider = tone === 'onBrand' ? 'border-white/20' : 'border-line-2';

  return (
    <div className={`mt-3 flex flex-col gap-1 border-t pt-3 ${divider}`}>
      <p className={`text-[13px] leading-[1.5] ${sunkColor}`}>
        이미 <span className="num font-bold">{stats.count}</span>건 ·{' '}
        <span className="num font-bold">{stats.exchanges}</span>개 거래소 거래를 계산해
        뒀어요.
      </p>
      <p className={`text-[12.5px] leading-[1.5] ${subColor}`}>
        정확히 신고하지 않으면 무신고·과소신고 가산세가 산출세액의 20~40%까지 붙어요.
      </p>
    </div>
  );
}
