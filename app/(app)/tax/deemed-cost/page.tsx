'use client';

// v2 #3: 의제취득가액 매뉴얼 입력 페이지 (Premium 전용).
//
// 철학 ([[reference_rates_data_philosophy]]): 자동 적재가 우선, 매뉴얼은 fallback의 fallback.
// 시스템이 자동으로 적재한 시가(real/estimate)가 부정확하다고 판단되거나, Upbit 미상장
// 코인이라 자동 적재가 안 되는 경우 사용자가 직접 입력하여 본인 계산에만 반영.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/lib/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { loadSession } from '@/lib/storage/session';
import {
  saveUserDeemedCostOverride,
  deleteUserDeemedCostOverride,
} from '@/app/actions/deemed-cost';

const DEEMED_DATE = '2026-12-31';

interface GlobalRow {
  coin: string;
  price_krw: number;
  source_type: 'real' | 'estimate';
}

interface UserOverrideRow {
  coin: string;
  price_krw: number;
}

interface CoinRowState {
  coin: string;
  globalPrice: number | null;
  globalSource: 'real' | 'estimate' | null;
  userOverride: number | null;
  inputValue: string;
  saving: boolean;
}

function formatPrice(n: number): string {
  return `₩${Math.round(n).toLocaleString('ko-KR')}`;
}

// 사용자가 거래내역에서 매수한 코인 중 2027-01-01 이전 매수가 있는 코인만 추출.
// 의제취득가액은 pre-2027 매수에만 적용되므로 그 외 코인은 표시할 의미 없음.
function extractPreDeemedCoins(): string[] {
  const session = loadSession();
  if (!session?.allParsed) return [];
  const set = new Set<string>();
  for (const tx of session.allParsed) {
    if (tx.type !== 'BUY') continue;
    // ISO date 비교: YYYY-MM-DD prefix만 비교해도 충분.
    if (tx.date.slice(0, 10) < '2027-01-01') {
      set.add(tx.coin);
    }
  }
  return Array.from(set).sort();
}

export default function DeemedCostPage() {
  const toast = useToast();
  const { user, loading: userLoading } = useCurrentUser();
  const [rows, setRows] = useState<CoinRowState[]>([]);
  const [loading, setLoading] = useState(true);

  const isFree = !userLoading && user?.plan !== 'premium';

  useEffect(() => {
    if (userLoading) return;
    let cancelled = false;
    (async () => {
      const coins = extractPreDeemedCoins();
      if (coins.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const [globalRes, overrideRes] = await Promise.all([
        supabase
          .from('deemed_cost_snapshots')
          .select('coin, price_krw, source_type')
          .in('coin', coins)
          .eq('deemed_date', DEEMED_DATE),
        supabase
          .from('user_deemed_cost_overrides')
          .select('coin, price_krw')
          .in('coin', coins)
          .eq('deemed_date', DEEMED_DATE),
      ]);

      if (cancelled) return;

      const globalMap = new Map<
        string,
        { price: number; source: 'real' | 'estimate' }
      >();
      for (const r of (globalRes.data ?? []) as GlobalRow[]) {
        if (r.source_type === 'real' || r.source_type === 'estimate') {
          globalMap.set(r.coin, {
            price: Number(r.price_krw),
            source: r.source_type,
          });
        }
      }

      const overrideMap = new Map<string, number>();
      for (const r of (overrideRes.data ?? []) as UserOverrideRow[]) {
        overrideMap.set(r.coin, Number(r.price_krw));
      }

      setRows(
        coins.map((coin) => {
          const global = globalMap.get(coin) ?? null;
          const override = overrideMap.get(coin) ?? null;
          return {
            coin,
            globalPrice: global?.price ?? null,
            globalSource: global?.source ?? null,
            userOverride: override,
            inputValue: override != null ? String(Math.round(override)) : '',
            saving: false,
          };
        }),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userLoading]);

  function updateInput(coin: string, value: string) {
    setRows((rs) =>
      rs.map((r) =>
        r.coin === coin
          ? { ...r, inputValue: value.replace(/[^\d.]/g, '') }
          : r,
      ),
    );
  }

  async function handleSave(coin: string) {
    const row = rows.find((r) => r.coin === coin);
    if (!row) return;
    const price = Number(row.inputValue);
    if (!Number.isFinite(price) || price <= 0) {
      toast.show('0보다 큰 숫자를 입력해주세요.', 'error');
      return;
    }
    setRows((rs) =>
      rs.map((r) => (r.coin === coin ? { ...r, saving: true } : r)),
    );
    const res = await saveUserDeemedCostOverride(coin, price);
    if (!res.ok) {
      toast.show(res.error ?? '저장 실패', 'error');
      setRows((rs) =>
        rs.map((r) => (r.coin === coin ? { ...r, saving: false } : r)),
      );
      return;
    }
    setRows((rs) =>
      rs.map((r) =>
        r.coin === coin
          ? { ...r, userOverride: price, saving: false }
          : r,
      ),
    );
    toast.show(
      `${coin} 의제취득가액 저장됨. 세금 계산 페이지에서 자동 재계산됩니다.`,
      'success',
    );
  }

  async function handleReset(coin: string) {
    setRows((rs) =>
      rs.map((r) => (r.coin === coin ? { ...r, saving: true } : r)),
    );
    const res = await deleteUserDeemedCostOverride(coin);
    if (!res.ok) {
      toast.show(res.error ?? '삭제 실패', 'error');
      setRows((rs) =>
        rs.map((r) => (r.coin === coin ? { ...r, saving: false } : r)),
      );
      return;
    }
    setRows((rs) =>
      rs.map((r) =>
        r.coin === coin
          ? { ...r, userOverride: null, inputValue: '', saving: false }
          : r,
      ),
    );
    toast.show(`${coin} 자동값으로 복귀됨.`, 'success');
  }

  return (
    <>
      <PageHeader
        title="의제취득가액 직접 입력"
        description="2026-12-31 종가가 부정확하거나 미상장 코인일 때 직접 입력할 수 있습니다. 본인 계산에만 반영됩니다."
        right={
          <Link href="/tax">
            <Button variant="secondary">세금 계산으로</Button>
          </Link>
        }
      />

      {isFree && (
        <Card padding="lg" className="mb-6 border-brand/30 bg-brand-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] font-bold text-brand">
                프리미엄 전용 기능
              </div>
              <p className="mt-1 text-[12.5px] text-ink-2">
                자동 적재된 시가가 부정확하거나 미상장 코인의 경우 직접 입력
                가능합니다. 결제 후 즉시 사용할 수 있어요.
              </p>
            </div>
            <Link href="/billing">
              <Button>유료 플랜 보기</Button>
            </Link>
          </div>
        </Card>
      )}

      <Card padding="lg">
        <div className="mb-4 text-[13px] leading-[1.65] text-ink-2">
          <strong className="text-ink">자동 적재가 우선입니다.</strong> 시스템이
          매일 KST 01:00에 Upbit 종가를 자동 적재합니다 (Upbit KRW 마켓
          상장 코인 40개+). 다음 경우에만 직접 입력하세요:
          <ul className="ml-5 mt-2 list-disc space-y-1 text-muted">
            <li>Upbit에 상장되지 않은 코인 (DUSK, FLOKI 등)</li>
            <li>본인이 거래한 거래소 종가가 더 정확하다고 판단되는 경우</li>
            <li>2026-12-31 도래 전 추정치(estimate)를 다른 값으로 시뮬레이션</li>
          </ul>
        </div>

        {loading ? (
          <p className="px-2 py-8 text-center text-[13px] text-muted">
            불러오는 중…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-muted">
            2027-01-01 이전 매수 기록이 있는 코인이 없습니다. 거래내역을
            업로드하면 여기에 표시됩니다.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-line-2">
            {rows.map((row) => {
              const appliedPrice = row.userOverride ?? row.globalPrice;
              const isOverridden = row.userOverride != null;
              const isMissing = row.globalPrice == null && !isOverridden;
              return (
                <div
                  key={row.coin}
                  className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-ink">
                      {row.coin}
                    </span>
                    {isOverridden ? (
                      <Pill tone="brand" size="sm">
                        매뉴얼
                      </Pill>
                    ) : row.globalSource === 'real' ? (
                      <Pill tone="good" size="sm">
                        실측
                      </Pill>
                    ) : row.globalSource === 'estimate' ? (
                      <Pill tone="warn" size="sm">
                        추정
                      </Pill>
                    ) : (
                      <Pill tone="bad" size="sm">
                        미상장
                      </Pill>
                    )}
                  </div>
                  <div className="text-[12.5px] text-muted">
                    <span className="text-muted-2">현재 적용:</span>{' '}
                    {appliedPrice != null ? (
                      <span className="num font-semibold text-ink">
                        {formatPrice(appliedPrice)}
                      </span>
                    ) : (
                      <span className="text-bad">
                        시가 없음 — 매뉴얼 입력 필요
                      </span>
                    )}
                    {isMissing && (
                      <div className="mt-0.5 text-[11px] text-muted-2">
                        자동 적재 안 됨. 입력하지 않으면 실 매수가가 사용됩니다.
                      </div>
                    )}
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="₩ 직접 입력"
                    value={row.inputValue}
                    onChange={(e) => updateInput(row.coin, e.target.value)}
                    disabled={isFree || row.saving}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(row.coin)}
                      disabled={isFree || row.saving || !row.inputValue}
                    >
                      {row.saving ? '저장 중…' : '저장'}
                    </Button>
                    {isOverridden && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReset(row.coin)}
                        disabled={isFree || row.saving}
                      >
                        자동으로
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
