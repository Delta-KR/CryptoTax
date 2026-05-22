import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { BarChart } from '@/components/ui/Chart/BarChart';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';

// 샘플 미리보기 — 하드코딩된 가상 데이터로 Tax + Report 합본 데모.
// 로그인 없이 확인 가능. (marketing)/sample 경로.

const sampleData = {
  year: 2027,
  totalGain: 21_200_000,
  deduction: 2_500_000,
  taxable: 18_700_000,
  tax: 4_114_000,
  transactionCount: 247,
  perCoin: [
    { coin: 'BTC', gain: 20_000_000 },
    { coin: 'ETH', gain: -3_000_000 },
    { coin: 'SOL', gain: 3_000_000 },
    { coin: 'XRP', gain: 1_200_000 },
  ],
};

function formatKrw(n: number): string {
  const sign = n < 0 ? '−' : n > 0 ? '+' : '';
  const abs = Math.abs(n);
  if (abs >= 10_000) return `${sign}₩${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}₩${abs.toLocaleString()}`;
}

export default function SamplePage() {
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-8 flex flex-col gap-3">
          <Pill tone="brand" dot className="self-start">
            샘플 미리보기 · 로그인 없이 확인 가능
          </Pill>
          <h1 className="text-[32px] font-extrabold tracking-tighter3 text-ink sm:text-[44px]">
            홍길동님의 <span className="text-brand">2027년 양도소득세</span>
          </h1>
          <p className="max-w-[640px] text-body-lead text-muted">
            247건의 거래를 통합해서 한국 세법 기준으로 계산한 결과입니다. 가입하시면 본인 데이터로 동일한 리포트를 받아볼 수 있습니다.
          </p>
        </div>

        {/* 4 stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="총 양도차익"
            value={formatKrw(sampleData.totalGain)}
            tone="good"
            sub={`${sampleData.transactionCount}건 거래`}
          />
          <StatCard
            label="기본공제"
            value={`−${formatKrw(sampleData.deduction).replace('−', '').replace('+', '')}`}
            sub="연 1회 자동 적용"
          />
          <StatCard
            label="과세표준"
            value={formatKrw(sampleData.taxable)}
            sub="총 양도차익 − 공제"
          />
          <StatCard
            label="납부세액"
            value={formatKrw(sampleData.tax)}
            tone="brand"
            sub="과세표준 × 20% (지방세 2% 별도)"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card padding="lg">
            <h2 className="mb-5 text-[16px] font-bold text-ink">코인별 손익</h2>
            <BarChart
              items={sampleData.perCoin.map((c) => ({
                label: c.coin,
                value: c.gain,
                gain: c.gain >= 0,
              }))}
              formatter={(n) => formatKrw(n)}
            />
            <div className="mt-5 border-t border-line-2 pt-3">
              <Pill tone="brand" size="sm">
                선입선출법(FIFO) 기준
              </Pill>
            </div>
          </Card>

          <Card padding="none">
            <div className="border-b border-line-2 px-6 py-4">
              <h2 className="text-[16px] font-bold text-ink">상세 손익</h2>
              <p className="mt-0.5 text-[12px] text-muted">{sampleData.year}년 매도 거래</p>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>코인</TableHeaderCell>
                  <TableHeaderCell className="text-right">손익</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleData.perCoin.map((c) => (
                  <TableRow key={c.coin}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <CoinIcon coin={c.coin} size={22} />
                        <span className="font-semibold">{c.coin}</span>
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        'num text-right text-[13px] font-bold ' +
                        (c.gain >= 0 ? 'text-good' : 'text-bad')
                      }
                    >
                      {formatKrw(c.gain)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* CTA */}
        <div
          className="mt-12 overflow-hidden rounded-2xl border border-brand/20 px-8 py-10 text-center"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, rgb(var(--brand)) 8%, rgb(var(--card))) 0%, rgb(var(--card)) 60%)',
          }}
        >
          <h2 className="text-[28px] font-extrabold tracking-tighter3 text-ink sm:text-[36px]">
            지금 가입하면 <span className="text-brand">내 데이터로</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-body-lead text-muted">
            거래소 파일만 올리면 동일한 리포트를 무료로 받아볼 수 있습니다.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-6 py-3 text-[15px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-colors hover:bg-brand-2"
            >
              무료로 시작하기 →
            </Link>
            <Link
              href="/#how"
              className="inline-flex items-center rounded-[10px] border border-line bg-card px-6 py-3 text-[15px] font-medium text-ink-2 transition-colors hover:bg-bg-soft"
            >
              작동 방식
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
