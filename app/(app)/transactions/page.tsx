'use client';
import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pill } from '@/components/ui/Pill';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import {
  getTransactions,
  exchangeLabel,
  type Transaction,
  type ExchangeId,
} from '@/lib/mock/transactions';
import {
  exportToJSON,
  importFromJSON,
  downloadAsFile,
} from '@/lib/storage/session';

// P1 #8: 거래별 환율 출처 표시. quoteCurrency=KRW면 직접거래로 표기.
function TxRateDetail({ tx }: { tx: Transaction }) {
  const isKRW = tx.originalCurrency === 'KRW';
  return (
    <div className="rounded-md border border-line bg-bg-soft px-4 py-3 text-[12px]">
      <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-2">
        환율 · 통화 출처
      </div>
      {isKRW ? (
        <div className="flex items-center gap-2 text-muted">
          <span className="rounded-full bg-card px-2 py-0.5 text-[10.5px] font-semibold text-ink-2 ring-1 ring-line">
            원화 직접거래
          </span>
          <span>환율 변환 없음 (KRW 마켓)</span>
        </div>
      ) : tx.rateMeta ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="num text-[13px] font-semibold text-ink">
              1 {tx.originalCurrency} = ₩
              {tx.rateMeta.rateKRW.toLocaleString('ko-KR', {
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11.5px] text-muted">
              · {tx.rateMeta.sourceDate} 기준
            </span>
            <span
              className={
                'rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                (tx.rateMeta.source === 'db'
                  ? 'bg-good-soft text-good ring-1 ring-good/30'
                  : 'bg-warn-soft text-warn ring-1 ring-warn/40')
              }
            >
              {tx.rateMeta.source === 'db' ? '✓ DB' : '⚠ Fallback'}
            </span>
            <span className="text-[11.5px] text-muted-2">
              · {tx.rateMeta.sourceName}
            </span>
          </div>
          {tx.rateMeta.source === 'static' && (
            <div className="mt-1.5 text-[11px] text-warn">
              정적 분기별 환율 적용 — 일별 시세 갱신 후 재계산을 권장합니다.
            </div>
          )}
        </>
      ) : (
        <div className="text-muted">환율 메타데이터 없음 (구버전 세션)</div>
      )}
    </div>
  );
}

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [exchange, setExchange] = useState<ExchangeId | 'all'>('all');
  const [coin, setCoin] = useState<string>('all');
  const [type, setType] = useState<'all' | 'buy' | 'sell'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // P1 #8: 거래별 펼치기 — 환율 출처 audit trail
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    setAll(getTransactions());
  }, []);

  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (exchange !== 'all' && t.exchange !== exchange) return false;
      if (coin !== 'all' && t.coin !== coin) return false;
      if (type !== 'all' && t.type !== type) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${t.coin} ${exchangeLabel[t.exchange]} ${t.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, exchange, coin, type, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 코인 옵션은 데이터에서 도출
  const coinOptions = useMemo(
    () => Array.from(new Set(all.map((t) => t.coin))).sort(),
    [all]
  );

  return (
    <>
      <PageHeader
        title="거래 내역"
        description={`총 ${filtered.length}건 · ${all.length}건 중 필터링`}
        right={
          <Link href="/transactions/upload">
            <Button
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 14V2M8 2l-4 4M8 2l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              CSV 업로드
            </Button>
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-line bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2fr]">
        <Select
          value={exchange}
          onChange={(e) => {
            setExchange(e.target.value as ExchangeId | 'all');
            setPage(1);
          }}
          aria-label="거래소"
        >
          <option value="all">거래소 전체</option>
          <option value="upbit">업비트</option>
          <option value="binance">바이낸스</option>
        </Select>
        <Select
          value={coin}
          onChange={(e) => {
            setCoin(e.target.value);
            setPage(1);
          }}
          aria-label="코인"
        >
          <option value="all">코인 전체</option>
          {coinOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as 'all' | 'buy' | 'sell');
            setPage(1);
          }}
          aria-label="구분"
        >
          <option value="all">매수/매도 전체</option>
          <option value="buy">매수만</option>
          <option value="sell">매도만</option>
        </Select>
        <Input
          placeholder="코인 / 거래소로 검색"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          leftIcon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {pageItems.length > 0 ? (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
              <span>
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
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
      ) : (
        <div className="rounded-lg border border-line bg-card">
          <EmptyState
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
            title={all.length === 0 ? '아직 거래 내역이 없습니다' : '조건에 맞는 거래가 없습니다'}
            description={
              all.length === 0
                ? '거래소 CSV/PDF/XLS 파일을 업로드하면 자동으로 통합됩니다.'
                : '필터를 조정하거나 검색어를 변경해보세요.'
            }
            action={
              all.length === 0 ? (
                <Link href="/transactions/upload">
                  <Button>CSV 업로드</Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setExchange('all');
                    setCoin('all');
                    setType('all');
                    setSearch('');
                  }}
                >
                  필터 초기화
                </Button>
              )
            }
          />
        </div>
      )}

      <DataBackupCard />
    </>
  );
}

function DataBackupCard() {
  const importRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<
    { type: 'info' | 'success' | 'error'; text: string } | null
  >(null);

  function handleExport() {
    const json = exportToJSON();
    if (!json) {
      setMessage({ type: 'info', text: '내보낼 거래 데이터가 없습니다.' });
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadAsFile(json, `kontaxt-backup-${date}.json`);
    setMessage({ type: 'success', text: '백업 파일이 다운로드됐습니다.' });
  }

  function handleImportClick() {
    importRef.current?.click();
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !window.confirm(
        '가져오기는 현재 거래 데이터를 덮어씁니다. 진행하시겠어요?',
      )
    ) {
      if (importRef.current) importRef.current.value = '';
      return;
    }
    try {
      const text = await file.text();
      const result = importFromJSON(text);
      if (result.ok) {
        setMessage({
          type: 'success',
          text: `${result.transactionCount ?? 0}개 거래를 가져왔습니다. 페이지를 새로고침하면 반영됩니다.`,
        });
      } else {
        setMessage({ type: 'error', text: result.error ?? '가져오기 실패' });
      }
    } catch {
      setMessage({ type: 'error', text: '파일 읽기 실패' });
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-line bg-card p-5">
      <h2 className="text-[14px] font-bold text-ink">거래 내역 백업</h2>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
        JSON 파일로 내보내거나 다른 디바이스에서 가져올 수 있습니다. 데이터는 브라우저에만 저장되어 있어, 다른 디바이스에서 사용하려면 백업 파일이 필요합니다.
      </p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleExport}>
          내보내기 (JSON)
        </Button>
        <Button variant="secondary" size="sm" onClick={handleImportClick}>
          가져오기
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportChange}
        />
      </div>
      {message && (
        <div
          className={`mt-3 rounded-md border px-3 py-2 text-[12px] leading-[1.55] ${
            message.type === 'error'
              ? 'border-bad/40 bg-bad-soft text-bad'
              : message.type === 'success'
                ? 'border-good/40 bg-good-soft text-good'
                : 'border-line bg-bg-soft text-muted'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
