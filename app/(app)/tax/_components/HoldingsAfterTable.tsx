import { CoinIcon } from '@/components/ui/CoinIcon';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import type { HoldingsByCoinClient } from '@/lib/client/tax';
import { formatShortDate } from '../_lib/format';

// P1 #10: 이월 보유 자산 — 신고 연도 종료 시점 잔여 lots.
export function HoldingsAfterTable({
  holdings,
}: {
  holdings: HoldingsByCoinClient[];
}) {
  if (holdings.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-[13px] text-muted">
        해당 연도 종료 시점 보유 자산이 없어요.
      </p>
    );
  }
  return (
    <Table className="border-t border-line-2">
      <TableHead>
        <TableRow>
          <TableHeaderCell>코인</TableHeaderCell>
          <TableHeaderCell>매수일</TableHeaderCell>
          <TableHeaderCell>거래소</TableHeaderCell>
          <TableHeaderCell className="text-right">잔량 / 원수량</TableHeaderCell>
          <TableHeaderCell className="text-right">단가</TableHeaderCell>
          <TableHeaderCell className="text-right">취득가액</TableHeaderCell>
          <TableHeaderCell></TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {holdings.flatMap((h, hi) =>
          h.lots.map((lot, li) => {
            const ratio = lot.originalAmount > 0
              ? (lot.amount / lot.originalAmount) * 100
              : 100;
            return (
              <TableRow
                key={`${h.coin}|${lot.id}`}
                className={
                  li === 0 && hi > 0 ? 'border-t-2 border-line' : ''
                }
              >
                <TableCell>
                  {li === 0 ? (
                    <div>
                      <div className="inline-flex items-center gap-2">
                        <CoinIcon coin={h.coin} size={20} />
                        <span className="text-[12.5px] font-bold text-ink">
                          {h.coin}
                        </span>
                      </div>
                      <div className="num mt-0.5 text-[10.5px] text-muted-2">
                        총 {h.totalAmount.toLocaleString('ko-KR', {
                          maximumFractionDigits: 6,
                        })}{' '}
                        · 평균 ₩
                        {Math.round(h.avgCostKRW).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ) : (
                    ''
                  )}
                </TableCell>
                <TableCell className="num text-[11.5px] text-muted">
                  {formatShortDate(lot.date)}
                </TableCell>
                <TableCell className="text-[11.5px] text-muted">
                  {lot.exchange}
                </TableCell>
                <TableCell className="num text-right text-[11.5px]">
                  <div>
                    {lot.amount.toLocaleString('ko-KR', {
                      maximumFractionDigits: 8,
                    })}
                  </div>
                  <div className="text-[10px] text-muted-2">
                    / {lot.originalAmount.toLocaleString('ko-KR', {
                      maximumFractionDigits: 8,
                    })}{' '}
                    ({ratio.toFixed(0)}%)
                  </div>
                </TableCell>
                <TableCell className="num text-right text-[11.5px] text-muted">
                  ₩{Math.round(lot.pricePerUnitKRW).toLocaleString('ko-KR')}
                </TableCell>
                <TableCell className="num text-right text-[12px] font-semibold text-ink-2">
                  ₩{Math.round(lot.totalCostKRW).toLocaleString('ko-KR')}
                </TableCell>
                <TableCell>
                  {lot.isDeemedCost && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full border border-warn/40 bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold text-warn"
                      title="2026-12-31 의제취득가액 적용"
                    >
                      ⚖ 의제
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          }),
        )}
      </TableBody>
    </Table>
  );
}
