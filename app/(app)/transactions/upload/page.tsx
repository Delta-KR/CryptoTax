'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { FileDrop } from '@/components/ui/FileDrop';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { addBatch, type ExchangeId } from '@/lib/mock/transactions';

interface ExchangeInfo {
  id: ExchangeId;
  name: string;
  logo: string;
  format: string;
  guide: string;
  bg: string;
}

const exchanges: ExchangeInfo[] = [
  {
    id: 'upbit',
    name: '업비트',
    logo: '/logos/upbit.png',
    format: 'PDF',
    guide: '거래내역 > 양도소득 > PDF 다운로드',
    bg: '#EEF3FF',
  },
  {
    id: 'binance',
    name: '바이낸스',
    logo: '/logos/binance.png',
    format: 'CSV',
    guide: 'Wallet > Transaction History > Export CSV',
    bg: '#FFFBEC',
  },
  {
    id: 'bybit',
    name: '바이빗',
    logo: '/logos/bybit.png',
    format: 'CSV',
    guide: 'Assets > Transaction Log > Download',
    bg: '#FFF7ED',
  },
];

export default function UploadPage() {
  const toast = useToast();
  const [active, setActive] = useState<string>('upbit');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploaded, setUploaded] = useState<Record<string, number>>({});
  const timersRef = useRef<Map<string, number>>(new Map());

  function startUpload(exchangeId: ExchangeId, fileName: string) {
    // 기존 타이머 정리
    const existing = timersRef.current.get(exchangeId);
    if (existing) window.clearInterval(existing);

    setProgress((p) => ({ ...p, [exchangeId]: 0 }));
    const tick = window.setInterval(() => {
      setProgress((prev) => {
        const current = prev[exchangeId] ?? 0;
        const next = Math.min(100, current + 10 + Math.random() * 15);
        if (next >= 100) {
          window.clearInterval(tick);
          timersRef.current.delete(exchangeId);
          const count = 5 + Math.floor(Math.random() * 8);
          addBatch(exchangeId, count);
          setUploaded((u) => ({ ...u, [exchangeId]: (u[exchangeId] ?? 0) + count }));
          toast.show(`${fileName} 업로드 완료 · 거래 ${count}건 추가`, 'success');
          return { ...prev, [exchangeId]: 100 };
        }
        return { ...prev, [exchangeId]: next };
      });
    }, 200);
    timersRef.current.set(exchangeId, tick);
  }

  return (
    <>
      <PageHeader
        title="거래 데이터 통합"
        description="거래소별 거래내역 파일을 업로드하면 자동으로 형식을 통일합니다."
        right={
          <Link href="/transactions">
            <Button variant="secondary">통합 거래 내역 보기 →</Button>
          </Link>
        }
      />

      <Tabs value={active} onChange={setActive}>
        <TabsList>
          {exchanges.map((e) => (
            <TabsTrigger key={e.id} value={e.id}>
              {e.name}
              {uploaded[e.id] ? (
                <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-good px-1 text-[10px] font-bold text-white">
                  {uploaded[e.id]}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {exchanges.map((ex) => {
          const p = progress[ex.id];
          const uploading = p != null && p < 100;
          const done = p === 100;
          return (
            <TabsContent key={ex.id} value={ex.id} className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <Card padding="lg" className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div
                    className="exchange-logo-bg flex h-10 w-10 items-center justify-center rounded-md"
                    style={{ '--logo-bg': ex.bg } as React.CSSProperties}
                  >
                    <Image src={ex.logo} alt={ex.name} width={22} height={22} className="object-contain" />
                  </div>
                  <div>
                    <div className="text-[16px] font-bold text-ink">{ex.name} 거래내역</div>
                    <div className="mt-0.5 text-[12px] text-muted">{ex.guide}</div>
                  </div>
                  <Pill tone="neutral" className="ml-auto font-mono">
                    .{ex.format.toLowerCase()}
                  </Pill>
                </div>

                <FileDrop
                  onFile={(file) => startUpload(ex.id, file.name)}
                  disabled={uploading}
                  title={uploading ? '업로드 중…' : '파일을 끌어다 놓거나 클릭'}
                  description={`${ex.format} 형식 권장 · 최대 10MB`}
                />

                {p != null && (
                  <ProgressBar
                    value={p}
                    label={done ? '완료' : '업로드 중'}
                  />
                )}

                {done && uploaded[ex.id] && (
                  <div className="flex items-center justify-between rounded-md border border-good/40 bg-good-soft px-4 py-3 text-[13px]">
                    <span className="text-good">
                      ✓ {ex.name} 거래 {uploaded[ex.id]}건 통합 완료
                    </span>
                    <Link
                      href="/transactions"
                      className="font-semibold text-good underline"
                    >
                      확인하기
                    </Link>
                  </div>
                )}
              </Card>

              <Card padding="md" surface="card-2">
                <h3 className="text-[14px] font-bold text-ink">파일 다운로드 가이드</h3>
                <ol className="mt-3 flex flex-col gap-2.5 text-[13px] text-muted">
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-faint text-[10px] font-bold text-brand">
                      1
                    </span>
                    <span>{ex.name} 웹사이트 로그인</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-faint text-[10px] font-bold text-brand">
                      2
                    </span>
                    <span>{ex.guide}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-faint text-[10px] font-bold text-brand">
                      3
                    </span>
                    <span>다운로드한 {ex.format} 파일을 좌측 영역에 끌어놓기</span>
                  </li>
                </ol>
                <p className="mt-4 rounded-sm bg-bg-soft px-3 py-2 text-[12px] text-muted-2">
                  업로드된 파일은 서버에 저장되지 않으며, 처리 후 즉시 삭제됩니다.
                </p>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
