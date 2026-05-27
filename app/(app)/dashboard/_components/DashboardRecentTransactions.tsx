import Link from 'next/link';
import { Card } from '@/components/ui/Card';
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

// 대시보드 최근 거래 Card. 연도 안 최신 5건 표시 + 전체 보기 link.
export function DashboardRecentTransactions({
  recent,
  year,
}: {
  recent: Transaction[];
  year: number;
}) {
  return (
    <Card className="mt-6" padding="none">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-[16px] font-bold text-ink">최근 거래</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {year}년 거래 중 최신 5건
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-[13px] font-semibold text-brand hover:underline"
        >
          전체 보기 →
        </Link>
      </div>
      {recent.length > 0 ? (
        <Table className="border-t border-line-2">
          <TableHead>
            <TableRow>
              <TableHeaderCell>날짜</TableHeaderCell>
              <TableHeaderCell>거래소</TableHeaderCell>
              <TableHeaderCell>코인</TableHeaderCell>
              <TableHeaderCell>구분</TableHeaderCell>
              <TableHeaderCell className="text-right">수량</TableHeaderCell>
              <TableHeaderCell className="text-right">금액</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recent.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="num text-[12px] text-muted">
                  {new Date(tx.date).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell>{exchangeLabel[tx.exchange]}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <CoinIcon coin={tx.coin} size={22} />
                    <span className="font-semibold">{tx.coin}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <Pill tone={tx.type === 'buy' ? 'good' : 'bad'} size="sm">
                    {tx.type === 'buy' ? '매수' : '매도'}
                  </Pill>
                </TableCell>
                <TableCell className="num text-right text-[12px]">
                  {tx.amount.toLocaleString()}
                </TableCell>
                <TableCell className="num text-right text-[13px] font-semibold text-ink">
                  ₩{tx.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="border-t border-line-2 px-6 py-12 text-center text-[13px] text-muted">
          {year}년 거래가 없어요.
        </p>
      )}
    </Card>
  );
}
