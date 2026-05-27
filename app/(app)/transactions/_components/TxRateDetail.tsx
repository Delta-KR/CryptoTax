import { type Transaction } from '@/lib/client/transactions';

// P1 #8: 거래별 환율 출처 표시. quoteCurrency=KRW 면 직접거래로 표기.
// 거래 row 펼치기 시 표시되는 audit trail.
export function TxRateDetail({ tx }: { tx: Transaction }) {
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
              정적 분기별 환율 적용 — 일별 시세 갱신 후 재계산을 권해 드려요.
            </div>
          )}
        </>
      ) : (
        <div className="text-muted">환율 메타데이터 없음 (구버전 세션)</div>
      )}
    </div>
  );
}
