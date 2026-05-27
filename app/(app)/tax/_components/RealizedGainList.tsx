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
  formatKrw,
  type RealizedGainClient,
  type TaxMethod,
} from '@/lib/client/tax';
import { formatShortDate, formatAmount } from '../_lib/format';

export function RealizedGainList({
  gains,
  method,
}: {
  gains: RealizedGainClient[];
  method: TaxMethod;
}) {
  if (gains.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-[13px] text-muted">
        해당 연도 매도 거래가 없어요.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line-2">
      {gains.map((g) => (
        <li key={g.id}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 transition-colors hover:bg-bg-soft">
              <svg
                className="size-3 flex-shrink-0 text-muted transition-transform group-open:rotate-90"
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
              <span className="num w-[78px] text-[12px] text-muted">
                {formatShortDate(g.sellDate)}
              </span>
              <CoinIcon coin={g.coin} size={20} />
              <span className="min-w-[50px] text-[13px] font-semibold text-ink">
                {g.coin}
              </span>
              <span className="hidden text-[11.5px] text-muted-2 sm:inline">
                {g.exchange}
              </span>
              <span className="num ml-auto hidden text-[12px] text-muted md:inline">
                {formatAmount(g.sellAmount)}
              </span>
              <span className="num w-[110px] text-right text-[12.5px] font-semibold text-ink-2">
                ₩{Math.round(g.proceedsKRW).toLocaleString('ko-KR')}
              </span>
              <span
                className={
                  'num w-[110px] text-right text-[13px] font-bold ' +
                  (g.pnlKRW >= 0 ? 'text-good' : 'text-bad')
                }
              >
                {formatKrw(g.pnlKRW)}
              </span>
            </summary>
            <div className="border-t border-line-2 bg-bg-soft px-6 py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-2">
                  사용된 매수 lot
                </div>
                <div className="num text-[11px] text-muted-2">
                  매도 ₩{Math.round(g.proceedsKRW).toLocaleString('ko-KR')} − 취득
                  ₩{Math.round(g.costBasisKRW).toLocaleString('ko-KR')} − 수수료
                  ₩{Math.round(g.sellFeeKRW + g.buyFeeKRW).toLocaleString('ko-KR')}
                </div>
              </div>
              {method === 'avg' ? (
                <div className="rounded-md border border-line bg-card px-4 py-3 text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink-2">
                      이동평균 (혼합 매수)
                    </span>
                    {g.consumedLots[0]?.isDeemedCost && (
                      <span
                        className="rounded-full border border-warn/40 bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn"
                        title="underlying lots 중 의제취득가액 적용 lot 포함"
                      >
                        ⚖ 의제 포함
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-muted sm:grid-cols-4">
                    <div>
                      <div className="text-muted-2">사용 수량</div>
                      <div className="num font-semibold text-ink-2">
                        {formatAmount(g.consumedLots[0]?.amount ?? g.sellAmount)} {g.coin}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-2">평균 단가</div>
                      <div className="num font-semibold text-ink-2">
                        ₩
                        {Math.round(
                          g.consumedLots[0]?.pricePerUnitKRW ?? 0,
                        ).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-2">취득가액</div>
                      <div className="num font-semibold text-ink-2">
                        ₩
                        {Math.round(g.costBasisKRW).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-2">매수 정보</div>
                      <div className="text-[11px] text-muted">
                        다수 lot 평균
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Table className="rounded-md border border-line bg-card">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="!py-2">매수일</TableHeaderCell>
                      <TableHeaderCell className="!py-2">거래소</TableHeaderCell>
                      <TableHeaderCell className="!py-2 text-right">
                        사용 수량
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-2 text-right">
                        단가
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-2 text-right">
                        취득가액
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-2">
                        <span className="sr-only">의제 여부</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {g.consumedLots.map((cl, i) => (
                      <TableRow key={cl.lotId + i}>
                        <TableCell className="num !py-2 text-[11.5px] text-muted">
                          {cl.buyDate ? formatShortDate(cl.buyDate) : '—'}
                        </TableCell>
                        <TableCell className="!py-2 text-[11.5px] text-muted">
                          {cl.exchange ?? '—'}
                        </TableCell>
                        <TableCell className="num !py-2 text-right text-[11.5px]">
                          {formatAmount(cl.amount)}
                        </TableCell>
                        <TableCell className="num !py-2 text-right text-[11.5px] text-muted">
                          ₩
                          {Math.round(cl.pricePerUnitKRW).toLocaleString(
                            'ko-KR',
                          )}
                        </TableCell>
                        <TableCell className="num !py-2 text-right text-[11.5px] font-semibold text-ink-2">
                          ₩
                          {Math.round(cl.costKRW).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="!py-2">
                          {cl.isDeemedCost ? (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full border border-warn/40 bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold text-warn"
                              title="2026-12-31 의제취득가액 적용"
                            >
                              ⚖ 의제
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
