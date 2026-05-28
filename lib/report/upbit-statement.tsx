/**
 * Upbit 거래내역 PDF 의 형식을 흉내내는 React PDF 컴포넌트.
 *
 * 실제 Upbit 의 PDF 는 사용자가 웹사이트에서 "거래내역" 페이지를 브라우저
 * 인쇄 다이얼로그로 PDF 저장한 것입니다 (Skia/PDF, Chrome). Kontaxt 의 `upbit.parser.ts`
 * 가 인식하는 키워드 패턴 (`업비트`, `체결시간`, `주문시간`, `거래수량`, `거래단가`,
 * `거래금액`) 과 표 구조를 그대로 따라갑니다.
 *
 * 외부 검증 패키지 (docs/legal-review/) 의 시나리오마다 Kontaxt 가 실제로 받을 형식의
 * Upbit PDF 예시를 첨부하기 위해 사용합니다.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const HEADER_FONT = 7;
const TABLE_FONT = 7;
const ROW_GAP = 4;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Pretendard',
    fontSize: TABLE_FONT,
    paddingHorizontal: 18,
    paddingVertical: 22,
    color: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: HEADER_FONT,
    color: '#6B7280',
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingBottom: 4,
    marginBottom: 6,
  },
  tableHeaderCell: {
    fontSize: TABLE_FONT,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'left',
    paddingHorizontal: 2,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: ROW_GAP,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  cell: {
    fontSize: TABLE_FONT,
    paddingHorizontal: 2,
    flexDirection: 'column',
  },
  cellLine: {
    fontSize: TABLE_FONT,
    lineHeight: 1.3,
  },
  cellMuted: {
    fontSize: TABLE_FONT,
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: HEADER_FONT,
    color: '#6B7280',
  },
});

// 컬럼별 width (Upbit 원본 sample 비율 참고).
const COL_WIDTHS = {
  executedAt: '11%',
  coin: '6%',
  market: '6%',
  type: '7%',
  amount: '17%',
  price: '12%',
  totalKRW: '12%',
  feeKRW: '10%',
  settlementKRW: '14%',
  orderedAt: '15%',
};

export type UpbitTxType = '매수' | '매도' | '입금' | '출금';

export interface UpbitTransactionRow {
  executedAt: Date; // 체결시간
  coin: string; // 코인 (BTC, ETH, USDT, DOGE, KRW)
  market: string | null; // 마켓 (KRW, "-" for 입출금)
  type: UpbitTxType;
  amount: number; // 거래수량
  amountUnit: string; // 단위 표기 (BTC, USDT, KRW)
  pricePerUnitKRW: number; // 거래단가
  totalKRW: number; // 거래금액
  feeKRW: number; // 수수료
  settlementKRW: number; // 정산금액
  orderedAt: Date | null; // 주문시간 (입출금은 null)
}

export interface UpbitStatementProps {
  rows: UpbitTransactionRow[];
  printedAt?: Date; // 헤더 좌측 인쇄 일시
  pageUrl?: string; // 푸터 좌측 URL — 기본 "/investments/history"
}

// 한국식 datetime 표시 — 헤더용 ("26. 5. 12. 오전 10:10")
function formatHeaderDateTime(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const yy = String(kst.getUTCFullYear()).slice(2);
  const m = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  const h = kst.getUTCHours();
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${yy}. ${m}. ${day}. ${ampm} ${h12}:${min}`;
}

// 표 데이터 — 날짜 (YYYY.MM.DD)
function formatDate(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

// 표 데이터 — 시간 (HH:MM)
function formatTime(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const h = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

// 천 단위 콤마 + 소수점 보존
function formatNumber(n: number, maxFractionDigits = 8): string {
  return n.toLocaleString('ko-KR', {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

function formatAmount(amount: number, unit: string): string {
  // 코인 (BTC, ETH 등) 은 소수점 8자리, KRW 는 0자리
  const isFiat = unit === 'KRW';
  const formatted = isFiat
    ? formatNumber(amount, 0)
    : formatNumber(amount, 8);
  return `${formatted} ${unit}`;
}

function formatKRW(n: number): string {
  return `${formatNumber(n, 2)} KRW`;
}

function formatPricePerUnit(n: number): string {
  // 단가 — 소수점 1자리까지 (sample 형식 "1,488.0 KRW")
  return `${n.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} KRW`;
}

// ─────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────

export function UpbitStatement({
  rows,
  printedAt,
  pageUrl,
}: UpbitStatementProps) {
  const printedDt =
    printedAt ??
    new Date(
      (rows[rows.length - 1]?.executedAt ?? new Date()).getTime() +
        7 * 24 * 3600 * 1000,
    );
  const url =
    pageUrl ?? 'https://www.upbit.com/investments/history';

  // 최근 거래가 위로 (실제 Upbit 정렬 — desc by executedAt)
  const sortedRows = [...rows].sort(
    (a, b) => b.executedAt.getTime() - a.executedAt.getTime(),
  );

  return (
    <Document
      title="업비트 | 가장 신뢰받는 디지털 자산 거래소"
      creator="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
      producer="Kontaxt Legal Review Sample (Upbit-style)"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header (브라우저 인쇄 자동 삽입) */}
        <View style={styles.header}>
          <Text>{formatHeaderDateTime(printedDt)}</Text>
          <Text>업비트 | 가장 신뢰받는 디지털 자산 거래소</Text>
        </View>

        {/* Table header */}
        <View style={styles.tableHeaderRow}>
          <Text
            style={[styles.tableHeaderCell, { width: COL_WIDTHS.executedAt }]}
          >
            체결시간
          </Text>
          <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.coin }]}>
            코인
          </Text>
          <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.market }]}>
            마켓
          </Text>
          <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.type }]}>
            종류
          </Text>
          <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.amount }]}>
            거래수량
          </Text>
          <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.price }]}>
            거래단가
          </Text>
          <Text
            style={[styles.tableHeaderCell, { width: COL_WIDTHS.totalKRW }]}
          >
            거래금액
          </Text>
          <Text style={[styles.tableHeaderCell, { width: COL_WIDTHS.feeKRW }]}>
            수수료
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: COL_WIDTHS.settlementKRW },
            ]}
          >
            정산금액
          </Text>
          <Text
            style={[styles.tableHeaderCell, { width: COL_WIDTHS.orderedAt }]}
          >
            주문시간
          </Text>
        </View>

        {/* Data rows */}
        {sortedRows.map((row, idx) => (
          <View key={idx} style={styles.dataRow}>
            <View style={[styles.cell, { width: COL_WIDTHS.executedAt }]}>
              <Text style={styles.cellLine}>{formatDate(row.executedAt)}</Text>
              <Text style={styles.cellLine}>{formatTime(row.executedAt)}</Text>
            </View>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.coin }]}>
              {row.coin}
            </Text>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.market }]}>
              {row.market ?? '-'}
            </Text>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.type }]}>
              {row.type}
            </Text>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.amount }]}>
              {formatAmount(row.amount, row.amountUnit)}
            </Text>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.price }]}>
              {formatPricePerUnit(row.pricePerUnitKRW)}
            </Text>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.totalKRW }]}>
              {formatKRW(row.totalKRW)}
            </Text>
            <Text style={[styles.cellLine, { width: COL_WIDTHS.feeKRW }]}>
              {row.type === '매수' || row.type === '매도'
                ? formatKRW(row.feeKRW)
                : '0 KRW'}
            </Text>
            <Text
              style={[styles.cellLine, { width: COL_WIDTHS.settlementKRW }]}
            >
              {formatKRW(row.settlementKRW)}
            </Text>
            <View style={[styles.cell, { width: COL_WIDTHS.orderedAt }]}>
              {row.orderedAt ? (
                <>
                  <Text style={styles.cellLine}>
                    {formatDate(row.orderedAt)}
                  </Text>
                  <Text style={styles.cellLine}>
                    {formatTime(row.orderedAt)}
                  </Text>
                </>
              ) : (
                <Text style={styles.cellMuted}>-</Text>
              )}
            </View>
          </View>
        ))}

        {/* Footer (브라우저 인쇄 자동 삽입) */}
        <View style={styles.footer} fixed>
          <Text>{url}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
