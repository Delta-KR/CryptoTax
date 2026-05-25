import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type {
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';
import { toKSTDateStr } from '@/lib/engine/exchange-rate';

const BRAND = '#2563EB';
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const GOOD = '#16A34A';
const BAD = '#DC2626';
const BG_SOFT = '#F8FAFC';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Pretendard',
    fontSize: 10,
    color: INK,
    paddingHorizontal: 40,
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: INK,
    paddingBottom: 14,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 9,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: INK,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    fontSize: 9,
    color: MUTED,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: INK,
    marginTop: 18,
    marginBottom: 8,
  },
  summaryBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    padding: 12,
    backgroundColor: BG_SOFT,
  },
  summaryCell: {
    width: '33.33%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 700,
    color: INK,
  },
  summaryValueBrand: {
    fontSize: 13,
    fontWeight: 800,
    color: BRAND,
  },
  taxBox: {
    marginTop: 12,
    borderRadius: 4,
    backgroundColor: BRAND,
    padding: 14,
  },
  taxLabel: {
    fontSize: 9,
    color: '#DBEAFE',
    marginBottom: 4,
  },
  taxValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  table: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  trLast: {
    flexDirection: 'row',
  },
  th: {
    fontSize: 9,
    fontWeight: 700,
    color: MUTED,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: BG_SOFT,
    flex: 1,
  },
  td: {
    fontSize: 10,
    color: INK,
    paddingVertical: 7,
    paddingHorizontal: 8,
    flex: 1,
  },
  tdRight: {
    textAlign: 'right',
  },
  pnlPositive: {
    color: GOOD,
    fontWeight: 700,
  },
  pnlNegative: {
    color: BAD,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
  },
  warnBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  warnText: {
    fontSize: 9,
    color: '#92400E',
    lineHeight: 1.4,
  },
});

function formatKRW(n: number): string {
  if (!Number.isFinite(n)) return '₩0';
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(Math.round(n));
  return `${sign}₩${abs.toLocaleString('ko-KR')}`;
}

function formatDate(iso: string): string {
  // KST 기준 — Vercel UTC 서버에서 PDF 생성 시에도 동일 결과 보장.
  // 'YYYY-MM-DD' 그대로 사용 (toKSTDateStr).
  return toKSTDateStr(new Date(iso));
}

function formatNumber(n: number, digits = 8): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

interface TaxReportProps {
  userName: string;
  year: number;
  result: TaxResultWire;
  transactions: UnifiedTransactionWire[];
  method?: 'totalAverage' | 'fifo' | 'avg';
}

function formatFetchedAt(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function TaxReport({
  userName,
  year,
  result,
  transactions,
  method = 'totalAverage',
}: TaxReportProps) {
  const generatedAt = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const sortedTxs = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  return (
    <Document title={`Kontaxt ${year}년 양도소득 신고 자료`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            KONTAXT · 가상자산 양도소득 자기 신고 자료
          </Text>
          <Text style={styles.title}>{year}년 귀속 양도소득 신고 자료</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>사용자: {userName}</Text>
            <Text style={styles.metaText}>
              계산 방식: {method === 'totalAverage' ? '총평균법 (시행령 §88①)' : method === 'fifo' ? '선입선출법 (FIFO)' : '이동평균법 (MA)'}
            </Text>
            <Text style={styles.metaText}>발행일: {generatedAt}</Text>
          </View>
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>연간 손익 요약</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>총 양도차익</Text>
            <Text style={styles.summaryValue}>
              {formatKRW(result.totalGainKRW)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>총 양도손실</Text>
            <Text style={styles.summaryValue}>
              {formatKRW(result.totalLossKRW)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>순손익</Text>
            <Text
              style={
                result.netPnLKRW >= 0
                  ? styles.summaryValueBrand
                  : styles.summaryValue
              }
            >
              {formatKRW(result.netPnLKRW)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>기본공제 (250만원)</Text>
            <Text style={styles.summaryValue}>
              {formatKRW(-result.deductionKRW)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>과세표준</Text>
            <Text style={styles.summaryValue}>
              {formatKRW(result.taxableIncomeKRW)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>세율</Text>
            <Text style={styles.summaryValue}>소득세 20% + 지방세 2%</Text>
          </View>
        </View>

        {/* Tax amount box */}
        <View style={styles.taxBox}>
          <Text style={styles.taxLabel}>
            {year + 1}년 5월 종합소득세 신고 시 납부세액
          </Text>
          <Text style={styles.taxValue}>{formatKRW(result.taxAmountKRW)}</Text>
          <Text
            style={{ fontSize: 9, color: '#DBEAFE', marginTop: 4 }}
          >
            소득세 {formatKRW(result.incomeTaxKRW)} + 지방소득세{' '}
            {formatKRW(result.localTaxKRW)}
          </Text>
        </View>

        {/* Per-coin breakdown */}
        {result.summary.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>코인별 손익 명세</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 1.2 }]}>코인</Text>
                <Text style={[styles.th, styles.tdRight]}>매수 총액</Text>
                <Text style={[styles.th, styles.tdRight]}>매도 총액</Text>
                <Text style={[styles.th, styles.tdRight]}>실현손익</Text>
                <Text style={[styles.th, styles.tdRight, { flex: 0.7 }]}>
                  수수료
                </Text>
                <Text style={[styles.th, styles.tdRight, { flex: 0.6 }]}>
                  거래 수
                </Text>
              </View>
              {result.summary.map((c, i) => (
                <View
                  key={c.coin}
                  style={i === result.summary.length - 1 ? styles.trLast : styles.tr}
                >
                  <Text style={[styles.td, { flex: 1.2, fontWeight: 700 }]}>
                    {c.coin}
                  </Text>
                  <Text style={[styles.td, styles.tdRight]}>
                    {formatKRW(c.totalBuyKRW)}
                  </Text>
                  <Text style={[styles.td, styles.tdRight]}>
                    {formatKRW(c.totalSellKRW)}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      styles.tdRight,
                      c.realizedPnLKRW >= 0
                        ? styles.pnlPositive
                        : styles.pnlNegative,
                    ]}
                  >
                    {formatKRW(c.realizedPnLKRW)}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { flex: 0.7 }]}>
                    {formatKRW(c.totalFeeKRW)}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { flex: 0.6 }]}>
                    {c.transactionCount}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 거래소별 손익 (P1 #9) — 거래소 × 코인 매트릭스 */}
        {result.summaryByExchange && result.summaryByExchange.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>거래소별 손익 명세</Text>
            <Text style={{ fontSize: 8, color: MUTED, marginBottom: 6, lineHeight: 1.4 }}>
              세무사 전달 시 정렬에 유용. 실현손익은 매도가 일어난 거래소 기준.
            </Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 1 }]}>거래소</Text>
                <Text style={[styles.th, { flex: 0.8 }]}>코인</Text>
                <Text style={[styles.th, styles.tdRight]}>매수</Text>
                <Text style={[styles.th, styles.tdRight]}>매도</Text>
                <Text style={[styles.th, styles.tdRight]}>실현손익</Text>
                <Text style={[styles.th, styles.tdRight, { flex: 0.6 }]}>
                  거래 수
                </Text>
              </View>
              {result.summaryByExchange.map((r, i) => {
                const isFirst =
                  i === 0 ||
                  result.summaryByExchange[i - 1].exchange !== r.exchange;
                const isLast = i === result.summaryByExchange.length - 1;
                return (
                  <View
                    key={`${r.exchange}|${r.coin}`}
                    style={isLast ? styles.trLast : styles.tr}
                  >
                    <Text
                      style={[
                        styles.td,
                        { flex: 1, fontWeight: 700, color: isFirst ? INK : MUTED },
                      ]}
                    >
                      {isFirst ? r.exchange : ''}
                    </Text>
                    <Text style={[styles.td, { flex: 0.8, fontWeight: 700 }]}>
                      {r.coin}
                    </Text>
                    <Text style={[styles.td, styles.tdRight, { fontSize: 9 }]}>
                      {formatKRW(r.totalBuyKRW)}
                    </Text>
                    <Text style={[styles.td, styles.tdRight, { fontSize: 9 }]}>
                      {formatKRW(r.totalSellKRW)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.tdRight,
                        r.realizedPnLKRW >= 0
                          ? styles.pnlPositive
                          : styles.pnlNegative,
                      ]}
                    >
                      {formatKRW(r.realizedPnLKRW)}
                    </Text>
                    <Text
                      style={[styles.td, styles.tdRight, { flex: 0.6 }]}
                    >
                      {r.transactionCount}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <View style={styles.warnBox}>
            <Text style={[styles.warnText, { fontWeight: 700, marginBottom: 3 }]}>
              ⚠ 안내
            </Text>
            {result.warnings.map((w, i) => (
              <Text key={i} style={styles.warnText}>
                · {w}
              </Text>
            ))}
          </View>
        )}

        {/* 환율 출처 + 의제취득가액 시가 출처 — 신뢰성 audit trail */}
        {(result.rateSource || result.deemedCostSource) && (
          <View
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: LINE,
              backgroundColor: BG_SOFT,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: 700, color: INK, marginBottom: 3 }}>
              데이터 출처 (신뢰성 검증용)
            </Text>
            {result.rateSource && (
              <>
                <Text style={{ fontSize: 9, color: MUTED, lineHeight: 1.5 }}>
                  · 일별 환율·시세: {result.rateSource.primary}
                  {result.rateSource.lastFetchedAt
                    ? ` (마지막 갱신: ${formatFetchedAt(result.rateSource.lastFetchedAt)})`
                    : ''}
                </Text>
                {result.rateSource.fallbackUsed && (
                  <Text style={{ fontSize: 9, color: '#92400E', lineHeight: 1.5, marginTop: 2 }}>
                    ⚠ 일부 거래에 정적 분기별 fallback 환율 사용 — 시세 갱신 후 재계산 권장.
                  </Text>
                )}
              </>
            )}
            {result.deemedCostSource && (
              <>
                <Text style={{ fontSize: 9, color: MUTED, lineHeight: 1.5, marginTop: 4 }}>
                  · 의제취득가액 시가 ({result.deemedCostSource.deemedDate} 기준):
                </Text>
                {result.deemedCostSource.realCoins.length > 0 && (
                  <Text style={{ fontSize: 9, color: GOOD, lineHeight: 1.5, marginLeft: 6 }}>
                    ✓ 실측: {result.deemedCostSource.realCoins.join(', ')}
                  </Text>
                )}
                {result.deemedCostSource.userOverrideCoins.length > 0 && (
                  <Text style={{ fontSize: 9, color: MUTED, lineHeight: 1.5, marginLeft: 6 }}>
                    ✓ 사용자 수동: {result.deemedCostSource.userOverrideCoins.join(', ')}
                  </Text>
                )}
                {result.deemedCostSource.estimateCoins.length > 0 && (
                  <Text style={{ fontSize: 9, color: '#92400E', lineHeight: 1.5, marginLeft: 6 }}>
                    ⚠ 추정치: {result.deemedCostSource.estimateCoins.join(', ')} (실시가 확정 후 재계산 권장)
                  </Text>
                )}
                {result.deemedCostSource.missingCoins.length > 0 && (
                  <Text style={{ fontSize: 9, color: BAD, lineHeight: 1.5, marginLeft: 6 }}>
                    ⚠ 시가 없음 → 실가 처리: {result.deemedCostSource.missingCoins.join(', ')}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `본 자료는 자기 신고용 참고자료이며, 최종 신고는 세무사 검토 또는 홈택스 직접 입력을 권장합니다.   ·   페이지 ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* 매도-매수 매칭 페이지 (P1 #6/#7) — 세무사 audit trail */}
      {result.realizedGains.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>
            매도 손익 명세 ({method === 'totalAverage' ? '총평균법' : method === 'fifo' ? '선입선출법 FIFO' : '이동평균법 MA'})
          </Text>
          <Text style={{ fontSize: 9, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>
            {method === 'totalAverage'
              ? '각 매도에 적용된 연 단위 총평균 단가입니다. 시행령 §88①·§92②4호에 따라 과세기간(1.1~12.31) 개시일 보유분 + 연내 매수분의 총가액 ÷ 총수량으로 평균단가를 산출합니다. lot 단위 추적이 없어 별도 매칭 정보는 표시되지 않습니다.'
              : method === 'fifo'
              ? '각 매도가 어떤 매수 lot과 페어됐는지 (선입선출 순). lot 단위로 매수일·거래소·의제 여부를 표시합니다.'
              : '각 매도에 적용된 평균 단가입니다. 의제 여부는 underlying 매수 중 하나라도 의제면 "의제 포함"으로 표시.'}
          </Text>

          {result.realizedGains.slice(0, 100).map((g) => (
            <View
              key={g.id}
              wrap={false}
              style={{
                marginBottom: 10,
                borderWidth: 1,
                borderColor: LINE,
                borderRadius: 3,
              }}
            >
              {/* 매도 거래 헤더 */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  backgroundColor: BG_SOFT,
                  borderBottomWidth: 1,
                  borderBottomColor: LINE,
                }}
              >
                <Text style={{ fontSize: 9, color: MUTED, width: 60 }}>
                  {formatDate(g.sellDate)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: 700, width: 50 }}>
                  {g.coin}
                </Text>
                <Text style={{ fontSize: 9, color: MUTED, width: 60 }}>
                  {g.exchange}
                </Text>
                <Text style={{ fontSize: 9, color: MUTED, flex: 1 }}>
                  {formatNumber(g.sellAmount)} {g.coin}
                </Text>
                <Text style={{ fontSize: 9, color: INK, width: 90, textAlign: 'right' }}>
                  매도 {formatKRW(g.proceedsKRW)}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    width: 90,
                    textAlign: 'right',
                    color: g.pnlKRW >= 0 ? GOOD : BAD,
                  }}
                >
                  {g.pnlKRW >= 0 ? '+' : ''}
                  {formatKRW(g.pnlKRW)}
                </Text>
              </View>

              {/* totalAverage 는 consumedLots 가 비어있음 — 평균 단가는 costBasisKRW/sellAmount 로 도출. */}
              {method === 'totalAverage' ? (
                <View
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 9, color: INK, flex: 1 }}>
                    총평균법 (연 평균 단가)
                  </Text>
                  <Text style={{ fontSize: 9, color: MUTED, width: 110, textAlign: 'right' }}>
                    평균 단가{' '}
                    {formatKRW(g.sellAmount > 0 ? g.costBasisKRW / g.sellAmount : 0)}
                  </Text>
                  <Text style={{ fontSize: 9, color: INK, width: 110, textAlign: 'right' }}>
                    취득 {formatKRW(g.costBasisKRW)}
                  </Text>
                </View>
              ) : method === 'avg' ? (
                <View
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 9, color: INK, flex: 1 }}>
                    이동평균 (혼합 매수){' '}
                    {g.consumedLots[0]?.isDeemedCost ? '· ⚖ 의제 포함' : ''}
                  </Text>
                  <Text style={{ fontSize: 9, color: MUTED, width: 110, textAlign: 'right' }}>
                    평균 단가{' '}
                    {formatKRW(g.consumedLots[0]?.pricePerUnitKRW ?? 0)}
                  </Text>
                  <Text style={{ fontSize: 9, color: INK, width: 110, textAlign: 'right' }}>
                    취득 {formatKRW(g.costBasisKRW)}
                  </Text>
                </View>
              ) : (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: '#FCFCFD',
                      borderBottomWidth: 1,
                      borderBottomColor: LINE,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 60, paddingVertical: 4, paddingHorizontal: 8 }}>
                      매수일
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 60, paddingVertical: 4, paddingHorizontal: 4 }}>
                      거래소
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, flex: 1, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                      사용 수량
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                      단가
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                      취득가액
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 40, paddingVertical: 4, paddingHorizontal: 4 }}>
                      의제
                    </Text>
                  </View>
                  {g.consumedLots.map((cl, i) => (
                    <View
                      key={cl.lotId + i}
                      style={{
                        flexDirection: 'row',
                        borderBottomWidth: i === g.consumedLots.length - 1 ? 0 : 1,
                        borderBottomColor: LINE,
                      }}
                    >
                      <Text style={{ fontSize: 8, color: INK, width: 60, paddingVertical: 4, paddingHorizontal: 8 }}>
                        {cl.buyDate ? formatDate(cl.buyDate) : '—'}
                      </Text>
                      <Text style={{ fontSize: 8, color: MUTED, width: 60, paddingVertical: 4, paddingHorizontal: 4 }}>
                        {cl.exchange ?? '—'}
                      </Text>
                      <Text style={{ fontSize: 8, color: INK, flex: 1, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                        {formatNumber(cl.amount)}
                      </Text>
                      <Text style={{ fontSize: 8, color: MUTED, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                        {formatKRW(cl.pricePerUnitKRW)}
                      </Text>
                      <Text style={{ fontSize: 8, color: INK, fontWeight: 700, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                        {formatKRW(cl.costKRW)}
                      </Text>
                      <Text style={{ fontSize: 8, color: '#92400E', fontWeight: 700, width: 40, paddingVertical: 4, paddingHorizontal: 4 }}>
                        {cl.isDeemedCost ? '⚖' : ''}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          ))}

          {result.realizedGains.length > 100 && (
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 6 }}>
              · 상위 100건만 표시 — 전체 {result.realizedGains.length}건 중. 추가 매칭 데이터가 필요하면 문의해주세요.
            </Text>
          )}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `본 자료는 자기 신고용 참고자료이며, 최종 신고는 세무사 검토 또는 홈택스 직접 입력을 권장합니다.   ·   페이지 ${pageNumber} / ${totalPages}`
            }
            fixed
          />
        </Page>
      )}

      {/* 이월 보유 자산 페이지 (P1 #10) — 내년 신고 시작점 */}
      {(() => {
        const holdingsEntries = Object.entries(result.holdingsAfter ?? {})
          .map(([coin, lots]) => ({
            coin,
            lots: (lots ?? []).filter((l) => l.amount > 0),
          }))
          .filter((h) => h.lots.length > 0)
          .sort((a, b) => a.coin.localeCompare(b.coin));

        if (holdingsEntries.length === 0) return null;

        return (
          <Page size="A4" style={styles.page}>
            <Text style={styles.sectionTitle}>
              이월 보유 자산 ({year + 1}년 신고 시작점)
            </Text>
            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>
              {method === 'totalAverage'
                ? `${year}년 종료 시점 잔여 보유분. 다음 해 총평균 단가의 기초 보유분으로 이월됩니다 (시행령 §92②4호). 각 lot의 매수일·거래소·의제 여부는 추적이 유지됩니다.`
                : method === 'fifo'
                ? `${year}년 종료 시점 잔여 lots. 다음 해 매도 시 이 lot들이 우선 소비됩니다 (FIFO). 각 lot의 매수일·거래소·의제 여부는 매도 발생 후에도 추적이 유지됩니다.`
                : `${year}년 종료 시점 잔여 lots. 다음 해 매도 시 이 lot들의 평균 단가가 기준이 됩니다 (이동평균). 각 lot의 매수일·거래소·의제 여부는 추적이 유지됩니다.`}
            </Text>

            {holdingsEntries.map((h) => {
              const totalAmount = h.lots.reduce((s, l) => s + l.amount, 0);
              const totalCost = h.lots.reduce(
                (s, l) => s + l.amount * l.pricePerUnitKRW,
                0,
              );
              return (
                <View
                  key={h.coin}
                  wrap={false}
                  style={{
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: LINE,
                    borderRadius: 3,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      backgroundColor: BG_SOFT,
                      borderBottomWidth: 1,
                      borderBottomColor: LINE,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 700, color: INK, flex: 1 }}>
                      {h.coin}
                    </Text>
                    <Text style={{ fontSize: 9, color: MUTED }}>
                      총 {formatNumber(totalAmount)} {h.coin} · 합산 취득{' '}
                      {formatKRW(totalCost)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: '#FCFCFD',
                      borderBottomWidth: 1,
                      borderBottomColor: LINE,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 65, paddingVertical: 4, paddingHorizontal: 8 }}>
                      매수일
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 65, paddingVertical: 4, paddingHorizontal: 4 }}>
                      거래소
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, flex: 1, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                      잔량 / 원수량
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                      단가
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                      취득가액
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, fontWeight: 700, width: 40, paddingVertical: 4, paddingHorizontal: 4 }}>
                      의제
                    </Text>
                  </View>
                  {h.lots.map((lot, i) => (
                    <View
                      key={lot.id + i}
                      style={{
                        flexDirection: 'row',
                        borderBottomWidth: i === h.lots.length - 1 ? 0 : 1,
                        borderBottomColor: LINE,
                      }}
                    >
                      <Text style={{ fontSize: 8, color: INK, width: 65, paddingVertical: 4, paddingHorizontal: 8 }}>
                        {formatDate(lot.date)}
                      </Text>
                      <Text style={{ fontSize: 8, color: MUTED, width: 65, paddingVertical: 4, paddingHorizontal: 4 }}>
                        {lot.exchange}
                      </Text>
                      <Text style={{ fontSize: 8, color: INK, flex: 1, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                        {formatNumber(lot.amount)} / {formatNumber(lot.originalAmount)}
                      </Text>
                      <Text style={{ fontSize: 8, color: MUTED, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                        {formatKRW(lot.pricePerUnitKRW)}
                      </Text>
                      <Text style={{ fontSize: 8, color: INK, fontWeight: 700, width: 90, paddingVertical: 4, paddingHorizontal: 4, textAlign: 'right' }}>
                        {formatKRW(lot.amount * lot.pricePerUnitKRW)}
                      </Text>
                      <Text style={{ fontSize: 8, color: '#92400E', fontWeight: 700, width: 40, paddingVertical: 4, paddingHorizontal: 4 }}>
                        {lot.isDeemedCost ? '⚖' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}

            <Text style={{ fontSize: 8, color: MUTED, marginTop: 6 }}>
              · 표시된 취득가액은 단가 × 잔량 기준. 매도 시점 시가는 별도 확인 필요.
              {' '}· ⚖ 표시는 2026-12-31 의제취득가액이 적용된 매수 lot.
            </Text>

            <Text
              style={styles.footer}
              render={({ pageNumber, totalPages }) =>
                `본 자료는 자기 신고용 참고자료이며, 최종 신고는 세무사 검토 또는 홈택스 직접 입력을 권장합니다.   ·   페이지 ${pageNumber} / ${totalPages}`
              }
              fixed
            />
          </Page>
        );
      })()}

      {/* Transactions page (if any) */}
      {sortedTxs.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>거래 명세 (최근 {sortedTxs.length}건)</Text>
          <Text style={{ fontSize: 8, color: MUTED, marginBottom: 6, lineHeight: 1.4 }}>
            P1 #8: 비-KRW 거래는 단가 하단에 적용 환율·출처·데이터 기준일 표시. ⚠ 표시는 정적 fallback 환율 적용.
          </Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={[styles.th, { flex: 1 }]}>일자</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>거래소</Text>
              <Text style={[styles.th, { flex: 0.7 }]}>코인</Text>
              <Text style={[styles.th, { flex: 0.6 }]}>구분</Text>
              <Text style={[styles.th, styles.tdRight, { flex: 1 }]}>
                수량
              </Text>
              <Text style={[styles.th, styles.tdRight, { flex: 1.4 }]}>
                단가 / 환율
              </Text>
              <Text style={[styles.th, styles.tdRight, { flex: 1.2 }]}>
                총액 (KRW)
              </Text>
            </View>
            {sortedTxs.map((tx, i) => (
              <View
                key={tx.id}
                style={i === sortedTxs.length - 1 ? styles.trLast : styles.tr}
              >
                <Text style={[styles.td, { flex: 1, fontSize: 9 }]}>
                  {formatDate(tx.date)}
                </Text>
                <Text style={[styles.td, { flex: 0.8, fontSize: 9 }]}>
                  {tx.exchange}
                </Text>
                <Text style={[styles.td, { flex: 0.7, fontWeight: 700 }]}>
                  {tx.coin}
                </Text>
                <Text
                  style={[
                    styles.td,
                    { flex: 0.6 },
                    tx.type === 'BUY' ? styles.pnlPositive : styles.pnlNegative,
                  ]}
                >
                  {tx.type === 'BUY' ? '매수' : tx.type === 'SELL' ? '매도' : 'SWAP'}
                </Text>
                <Text style={[styles.td, styles.tdRight, { flex: 1, fontSize: 9 }]}>
                  {formatNumber(tx.amount)}
                </Text>
                <View
                  style={{
                    flex: 1.4,
                    paddingVertical: 7,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ fontSize: 9, color: INK, textAlign: 'right' }}>
                    {formatKRW(tx.pricePerUnitKRW)}
                  </Text>
                  {tx.rateMeta && tx.originalCurrency !== 'KRW' ? (
                    <Text
                      style={{
                        fontSize: 7,
                        color: tx.rateMeta.source === 'static' ? '#92400E' : MUTED,
                        textAlign: 'right',
                        marginTop: 1,
                      }}
                    >
                      {tx.rateMeta.source === 'static' ? '⚠ ' : ''}
                      1 {tx.originalCurrency} = ₩
                      {tx.rateMeta.rateKRW.toLocaleString('ko-KR', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      ({tx.rateMeta.sourceDate})
                    </Text>
                  ) : tx.originalCurrency === 'KRW' ? (
                    <Text
                      style={{
                        fontSize: 7,
                        color: MUTED,
                        textAlign: 'right',
                        marginTop: 1,
                      }}
                    >
                      원화 직접거래
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.td, styles.tdRight, { flex: 1.2, fontSize: 9 }]}>
                  {formatKRW(tx.totalKRW)}
                </Text>
              </View>
            ))}
          </View>
          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `본 자료는 자기 신고용 참고자료이며, 최종 신고는 세무사 검토 또는 홈택스 직접 입력을 권장합니다.   ·   페이지 ${pageNumber} / ${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
