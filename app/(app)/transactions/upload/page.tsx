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
import { type ExchangeId } from '@/lib/mock/transactions';
import { getTaxMethod } from '@/lib/mock/tax';
import { calculateTaxFromFiles } from '@/app/actions/calculate';
import { appendUpload, loadSession, clearSession } from '@/lib/storage/session';

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
    guide: 'Wallet > Transaction History > Export CSV (Spot 전용)',
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

  async function startUpload(exchangeId: ExchangeId, file: File) {
    const existing = timersRef.current.get(exchangeId);
    if (existing) window.clearInterval(existing);

    setProgress((p) => ({ ...p, [exchangeId]: 0 }));
    const tick = window.setInterval(() => {
      setProgress((prev) => {
        const cur = prev[exchangeId] ?? 0;
        if (cur >= 90) return prev;
        return {
          ...prev,
          [exchangeId]: Math.min(90, cur + 8 + Math.random() * 10),
        };
      });
    }, 200);
    timersRef.current.set(exchangeId, tick);

    try {
      const session = loadSession();
      const formData = new FormData();
      formData.append('files', file);
      formData.append(
        'previousParsed',
        JSON.stringify(session?.allParsed ?? []),
      );
      // 사용자가 Tax 페이지에서 선택한 방식(FIFO/MA)을 localStorage에서 읽어 적용.
      formData.append('method', getTaxMethod());

      const result = await calculateTaxFromFiles(formData);

      window.clearInterval(tick);
      timersRef.current.delete(exchangeId);

      if (!result.ok) {
        setProgress((p) => ({ ...p, [exchangeId]: 0 }));
        toast.show(result.error, 'error');
        return;
      }

      const payload = result.payload;

      // 거래 0건이면 success가 아닌 명확한 안내. parser가 시그니처 검증을 통과해도
      // 파일이 비어있거나 헤더만 있는 경우 여기까지 도달할 수 있음.
      if (payload.newParsed.length === 0) {
        setProgress((p) => ({ ...p, [exchangeId]: 0 }));
        toast.show(
          `${file.name}에서 거래 행을 찾지 못했습니다. 올바른 거래내역 파일인지, 해당 기간에 거래가 있는지 확인해주세요.`,
          'error',
        );
        return;
      }

      appendUpload(payload, file.name);
      setProgress((p) => ({ ...p, [exchangeId]: 100 }));
      setUploaded((u) => ({
        ...u,
        [exchangeId]:
          (u[exchangeId] ?? 0) + payload.newParsed.length,
      }));

      toast.show(
        `${file.name} 파싱 완료 · 거래 ${payload.newParsed.length}건 추가`,
        'success',
      );

      // warnings는 전체 누적 세션의 진단 결과. 이번 업로드와 무관한 이전 데이터의
      // warning이 첫 번째에 있으면 사용자는 "방금 올린 파일의 결과"로 오해할 수 있음.
      // 이번 업로드에 등장한 코인의 warning을 우선 표시하고, 그게 없으면 이전 누적임을
      // 명시한 prefix로 표시.
      const warnings = payload.result.warnings;
      if (warnings.length > 0) {
        const newCoins = new Set(
          payload.newParsed.map((t) => t.coin),
        );
        // orphan warning은 "COIN 매도 N건..." 형태로 코인명 + 공백으로 시작.
        // 의제취득가액 warning은 "의제취득가액 추정치 적용: BTC, USDT..." 형태.
        const involvesNewCoin = (w: string) =>
          Array.from(newCoins).some(
            (coin) =>
              w.startsWith(`${coin} `) || w.includes(`: ${coin}`) || w.includes(`, ${coin}`),
          );
        const fromThisUpload = warnings.find(involvesNewCoin);
        if (fromThisUpload) {
          toast.show(fromThisUpload, 'info');
        } else {
          toast.show(
            `이전 업로드 누적 진단 — ${warnings[0]}`,
            'info',
          );
        }
      }
    } catch (err) {
      window.clearInterval(tick);
      timersRef.current.delete(exchangeId);
      setProgress((p) => ({ ...p, [exchangeId]: 0 }));
      const msg =
        err instanceof Error
          ? err.message
          : '예기치 못한 오류 — 새로고침 후 다시 시도해주세요';
      toast.show(msg, 'error');
    }
  }

  function handleReset() {
    clearSession();
    setProgress({});
    setUploaded({});
    toast.show('업로드 데이터가 초기화되었습니다.', 'success');
  }

  return (
    <>
      <PageHeader
        title="거래 데이터 통합"
        description="거래소별 거래내역 파일을 업로드하면 자동으로 통합·정규화되어 세금이 계산됩니다."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleReset}>
              초기화
            </Button>
            <Link href="/tax">
              <Button>세금 결과 →</Button>
            </Link>
          </div>
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
            <TabsContent
              key={ex.id}
              value={ex.id}
              className="grid gap-5 lg:grid-cols-[1fr_320px]"
            >
              <Card padding="lg" className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div
                    className="exchange-logo-bg flex h-10 w-10 items-center justify-center rounded-md"
                    style={{ '--logo-bg': ex.bg } as React.CSSProperties}
                  >
                    <Image
                      src={ex.logo}
                      alt={ex.name}
                      width={22}
                      height={22}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[16px] font-bold text-ink">
                      {ex.name} 거래내역
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {ex.guide}
                    </div>
                  </div>
                  <Pill tone="neutral" className="ml-auto font-mono">
                    .{ex.format.toLowerCase()}
                  </Pill>
                </div>

                <FileDrop
                  onFile={(file) => startUpload(ex.id, file)}
                  onReject={(reason) => toast.show(reason, 'error')}
                  disabled={uploading}
                  title={
                    uploading ? '처리 중…' : '파일을 끌어다 놓거나 클릭'
                  }
                  description={`${ex.format} 형식 권장 · 최대 10MB`}
                />

                {p != null && (
                  <ProgressBar
                    value={p}
                    label={done ? '완료' : '파싱 중'}
                  />
                )}

                {done && uploaded[ex.id] && (
                  <div className="flex items-center justify-between rounded-md border border-good/40 bg-good-soft px-4 py-3 text-[13px]">
                    <span className="text-good">
                      ✓ {ex.name} 거래 {uploaded[ex.id]}건 통합 완료
                    </span>
                    <Link
                      href="/tax"
                      className="font-semibold text-good underline"
                    >
                      세금 결과 보기
                    </Link>
                  </div>
                )}
              </Card>

              <Card padding="md" surface="card-2">
                <h3 className="text-[14px] font-bold text-ink">
                  파일 다운로드 가이드
                </h3>
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
                    <span>
                      다운로드한 {ex.format} 파일을 좌측 영역에 끌어놓기
                    </span>
                  </li>
                </ol>
                <p className="mt-4 rounded-sm bg-bg-soft px-3 py-2 text-[12px] text-muted-2">
                  업로드된 파일은 서버 메모리에서 처리 후 즉시 폐기됩니다.
                  결과는 브라우저에만 저장됩니다.
                </p>
                <Link
                  href="/guide#exchanges"
                  className="mt-3 block text-center text-[12px] font-semibold text-brand hover:underline"
                >
                  자세한 다운로드 가이드 보기 →
                </Link>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
