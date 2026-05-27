import { CoinIcon } from '@/components/ui/CoinIcon';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import { formatKrw, type ExchangeCoinPnL } from '@/lib/client/tax';

// P1 #9: 거래소별 손익 매트릭스.
export function ExchangeCoinMatrix({
  rows,
  masked,
}: {
  rows: ExchangeCoinPnL[];
  masked: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-[13px] text-muted">
        해당 연도 거래가 없어요.
      </p>
    );
  }
  return (
    <Table className="border-t border-line-2">
      <TableHead>
        <TableRow>
          <TableHeaderCell>거래소</TableHeaderCell>
          <TableHeaderCell>코인</TableHeaderCell>
          <TableHeaderCell className="text-right">매수</TableHeaderCell>
          <TableHeaderCell className="text-right">매도</TableHeaderCell>
          <TableHeaderCell className="text-right">손익</TableHeaderCell>
          <TableHeaderCell className="text-right">거래수</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => {
          const isFirst =
            i === 0 || rows[i - 1].exchange !== row.exchange;
          return (
            <TableRow
              key={`${row.exchange}|${row.coin}`}
              className={isFirst && i > 0 ? 'border-t-2 border-line' : ''}
            >
              <TableCell className="text-[12.5px] font-semibold text-ink-2">
                {isFirst ? row.exchange : ''}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <CoinIcon coin={row.coin} size={20} />
                  <span className="text-[12.5px] font-semibold">
                    {row.coin}
                  </span>
                </span>
              </TableCell>
              <TableCell className="num text-right text-[12px] text-muted">
                ₩{Math.round(row.buyKRW).toLocaleString('ko-KR')}
              </TableCell>
              <TableCell className="num text-right text-[12px] text-muted">
                ₩{Math.round(row.sellKRW).toLocaleString('ko-KR')}
              </TableCell>
              <TableCell
                className={
                  'num text-right text-[13px] font-bold ' +
                  (masked
                    ? 'text-muted-2'
                    : row.gain >= 0
                      ? 'text-good'
                      : 'text-bad')
                }
              >
                {masked ? '—' : formatKrw(row.gain)}
              </TableCell>
              <TableCell className="num text-right text-[12px] text-muted">
                {row.transactionCount}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
