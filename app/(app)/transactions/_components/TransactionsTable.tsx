import { Fragment } from 'react';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { CoinIcon } from '@/components/ui/CoinIcon';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import {
  exchangeLabel,
  type Transaction,
} from '@/lib/client/transactions';
import { TxRateDetail } from './TxRateDetail';

// 거래 목록 table + pagination.
// 거래 row 클릭 시 TxRateDetail audit trail 펼침.
export function TransactionsTable({
  pageItems,
  expanded,
  toggleExpand,
  safePage,
  totalPages,
  filteredCount,
  pageSize,
  setPage,
}: {
  pageItems: Transaction[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  safePage: number;
  totalPages: number;
  filteredCount: number;
  pageSize: number;
  setPage: (updater: (p: number) => number) => void;
}) {
  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-6"></TableHeaderCell>
            <TableHeaderCell>날짜</TableHeaderCell>
            <TableHeaderCell>거래소</TableHeaderCell>
            <TableHeaderCell>코인</TableHeaderCell>
            <TableHeaderCell>구분</TableHeaderCell>
            <TableHeaderCell className="text-right">수량</TableHeaderCell>
            <TableHeaderCell className="text-right">단가</TableHeaderCell>
            <TableHeaderCell className="text-right">금액</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pageItems.map((tx) => {
            const isOpen = expanded.has(tx.id);
            const hasFallback = tx.rateMeta?.source === 'static';
            return (
              <Fragment key={tx.id}>
                <TableRow
                  onClick={() => toggleExpand(tx.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(tx.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={`거래 상세 ${isOpen ? '접기' : '펼치기'}`}
                  className="cursor-pointer transition-colors hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                >
                  <TableCell className="!pr-0">
                    <svg
                      className={
                        'size-3 flex-shrink-0 text-muted transition-transform ' +
                        (isOpen ? 'rotate-90' : '')
                      }
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </TableCell>
                  <TableCell className="num text-[12px] text-muted">
                    {new Date(tx.date).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{exchangeLabel[tx.exchange]}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <CoinIcon coin={tx.coin} size={22} />
                      <span className="font-semibold">{tx.coin}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5">
                      <Pill
                        tone={tx.type === 'buy' ? 'good' : 'bad'}
                        size="sm"
                      >
                        {tx.type === 'buy' ? '매수' : '매도'}
                      </Pill>
                      {hasFallback && (
                        <span
                          className="rounded-full bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold text-warn ring-1 ring-warn/40"
                          title="정적 fallback 환율 적용"
                        >
                          ⚠ FB
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="num text-right text-[12px]">
                    {tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="num text-right text-[12px] text-muted">
                    ₩{tx.pricePerCoin.toLocaleString()}
                  </TableCell>
                  <TableCell className="num text-right text-[13px] font-semibold text-ink">
                    ₩{tx.total.toLocaleString()}
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-bg-tint hover:!bg-bg-tint">
                    <TableCell colSpan={8} className="!py-3">
                      <TxRateDetail tx={tx} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
          <span>
            {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredCount)} of {filteredCount}
          </span>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
