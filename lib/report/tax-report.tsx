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
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatNumber(n: number, digits = 8): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

interface TaxReportProps {
  userName: string;
  year: number;
  result: TaxResultWire;
  transactions: UnifiedTransactionWire[];
}

export function TaxReport({
  userName,
  year,
  result,
  transactions,
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
    <Document title={`크립토택스 ${year}년 양도소득 신고 자료`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            CRYPTOTAX · 가상자산 양도소득 자기 신고 자료
          </Text>
          <Text style={styles.title}>{year}년 귀속 양도소득 신고 자료</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>사용자: {userName}</Text>
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
            <Text style={styles.summaryValue}>22% (20%+2%)</Text>
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

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `본 자료는 자기 신고용 참고자료이며, 최종 신고는 세무사 검토 또는 홈택스 직접 입력을 권장합니다.   ·   페이지 ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Transactions page (if any) */}
      {sortedTxs.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>거래 명세 (최근 {sortedTxs.length}건)</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={[styles.th, { flex: 1 }]}>일자</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>거래소</Text>
              <Text style={[styles.th, { flex: 0.7 }]}>코인</Text>
              <Text style={[styles.th, { flex: 0.6 }]}>구분</Text>
              <Text style={[styles.th, styles.tdRight, { flex: 1 }]}>
                수량
              </Text>
              <Text style={[styles.th, styles.tdRight, { flex: 1.2 }]}>
                단가 (KRW)
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
                <Text style={[styles.td, styles.tdRight, { flex: 1.2, fontSize: 9 }]}>
                  {formatKRW(tx.pricePerUnitKRW)}
                </Text>
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
