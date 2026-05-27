import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { Pill } from '@/components/ui/Pill';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import {
  formatKrw,
  type TaxMethod,
  type TaxResult,
} from '@/lib/client/tax';

// /tax 페이지 우측 컬럼 — 코인별 손익 table. masked (free user) 시 전체 blur
// + paywall overlay. 빈 케이스에 "거래 없음" 안내.
export function TaxPerCoinCard({
  result,
  year,
  method,
  masked,
}: {
  result: TaxResult;
  year: number;
  method: TaxMethod;
  masked: boolean;
}) {
  return (
    <Card padding="none">
      <div className="px-6 py-4">
        <h2 className="text-[16px] font-bold text-ink">코인별 손익</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          {year}년 매도 거래 기준
        </p>
      </div>
      {result.perCoin.length > 0 ? (
        <div className="relative">
          <div
            className={
              masked
                ? 'pointer-events-none select-none blur-[8px]'
                : ''
            }
            aria-hidden={masked}
          >
            <Table className="border-t border-line-2">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>코인</TableHeaderCell>
                  <TableHeaderCell className="text-right">손익</TableHeaderCell>
                  <TableHeaderCell className="text-right">매도금액</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.perCoin.map((c) => (
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
                    <TableCell className="num text-right text-[12px] text-muted">
                      ₩{c.volume.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {masked && (
            <Link
              href="/billing"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
            >
              <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                Premium Only
              </div>
              <div className="text-[14px] font-bold text-ink">
                코인별 정확한 손익을 확인하세요
              </div>
              <button
                type="button"
                className="relative whitespace-nowrap rounded-md bg-brand px-6 py-3 text-[14px] font-extrabold text-white shadow-brand-glow transition-colors hover:bg-brand-2"
              >
                프리미엄 시작 →
              </button>
            </Link>
          )}
        </div>
      ) : (
        <p className="border-t border-line-2 px-6 py-12 text-center text-[13px] text-muted">
          {year}년 매도 거래가 없어요.
        </p>
      )}
      {result.perCoin.length > 0 && (
        <div className="border-t border-line-2 px-6 py-3">
          <Pill tone="brand" size="sm">
            {method === 'totalAverage'
              ? '총평균법'
              : method === 'fifo'
                ? '선입선출법(FIFO)'
                : '이동평균법(MA)'}
          </Pill>
        </div>
      )}
    </Card>
  );
}
