'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import { getPaymentHistory, type PaymentRecord } from '@/lib/client/billing';

const statusTone: Record<PaymentRecord['status'], 'good' | 'bad' | 'warn'> = {
  완료: 'good',
  환불: 'bad',
  대기: 'warn',
};

export default function HistoryPage() {
  const [items, setItems] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    setItems(getPaymentHistory());
  }, []);

  return (
    <>
      <PageHeader
        title="결제 내역"
        description={`총 ${items.length}건의 결제 기록`}
      />

      {items.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>날짜</TableHeaderCell>
              <TableHeaderCell>항목</TableHeaderCell>
              <TableHeaderCell className="text-right">금액</TableHeaderCell>
              <TableHeaderCell>상태</TableHeaderCell>
              <TableHeaderCell className="text-right">영수증</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="num text-[12px] text-muted">
                  {new Date(p.date).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell className="font-medium text-ink">{p.item}</TableCell>
                <TableCell className="num text-right text-[13px] font-semibold text-ink">
                  ₩{p.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Pill tone={statusTone[p.status]} size="sm">
                    {p.status}
                  </Pill>
                </TableCell>
                <TableCell className="text-right">
                  {p.receiptUrl && (
                    <a
                      href={p.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-semibold text-brand underline"
                    >
                      영수증
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-line bg-card">
          <EmptyState
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 11h18" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            }
            title="결제 내역이 없습니다"
            description="요금제를 업그레이드하면 결제 내역이 이곳에 표시돼요."
          />
        </div>
      )}
    </>
  );
}
