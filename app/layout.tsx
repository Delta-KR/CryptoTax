import type { Metadata } from 'next';
import { pretendard, jetbrainsMono } from './fonts';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const title = 'Kontaxt — 2027년 가상자산 양도소득세 완벽 대비';
const description =
  '업비트, 빗썸, 바이낸스 등 모든 거래소의 거래내역을 자동으로 통합해 한국 세법 기준으로 양도소득세를 계산합니다. 2027년 1월 1일 시행.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  keywords: [
    '가상자산 세금',
    '암호화폐 세금',
    '양도소득세',
    'Kontaxt',
    '업비트 세금',
    '빗썸 세금',
    '바이낸스 세금',
    '2027년 가상자산 과세',
    'FIFO 이동평균',
    '의제취득가액',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: SITE_NAME,
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'K63TuNFGKP-PlspHEFsR3YUfIfzbW9raL4Ey9WqEZYs',
    other: {
      'naver-site-verification': 'd81b5e07ea5596e0e3e16d48727cc98d152cc232',
    },
  },
};

// Inline before-paint script: one-time migration of legacy `crypto-tax-*` storage
// keys to `kontaxt-*` (rebrand 2026-05), then restore saved theme so we don't
// flash light → dark on first paint.
const bootScript = `
(function () {
  try {
    var FLAG = 'kontaxt-migration-v1';
    if (localStorage.getItem(FLAG) !== 'done') {
      var L = [
        ['crypto-tax-theme', 'kontaxt-theme'],
        ['crypto-tax-plan', 'kontaxt-plan'],
        ['crypto-tax-billing-history', 'kontaxt-billing-history'],
        ['crypto-tax-taxpro', 'kontaxt-taxpro'],
        ['crypto-tax-method', 'kontaxt-method'],
        ['crypto-tax-notifications', 'kontaxt-notifications'],
        ['crypto-tax-session-v1', 'kontaxt-session-v1']
      ];
      for (var i = 0; i < L.length; i++) {
        var ov = localStorage.getItem(L[i][0]);
        if (ov !== null && localStorage.getItem(L[i][1]) === null) {
          localStorage.setItem(L[i][1], ov);
        }
        localStorage.removeItem(L[i][0]);
      }
      var S = [['crypto-tax-pending-plan', 'kontaxt-pending-plan']];
      for (var j = 0; j < S.length; j++) {
        var sv = sessionStorage.getItem(S[j][0]);
        if (sv !== null && sessionStorage.getItem(S[j][1]) === null) {
          sessionStorage.setItem(S[j][1], sv);
        }
        sessionStorage.removeItem(S[j][0]);
      }
      localStorage.setItem(FLAG, 'done');
    }
    var t = localStorage.getItem('kontaxt-theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

// JSON-LD structured data — SoftwareApplication with 3 pricing offers.
// Surfaces price/category to search engines beyond plain metadata.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description,
  url: SITE_URL,
  inLanguage: 'ko-KR',
  offers: [
    {
      '@type': 'Offer',
      name: '무료',
      price: '0',
      priceCurrency: 'KRW',
      description: '결제 전 결과 미리보기 및 검증',
    },
    {
      '@type': 'Offer',
      name: '단일 과세연도',
      price: '29900',
      priceCurrency: 'KRW',
      description: '선택한 1개 과세연도 결과 열람 + PDF 리포트 무제한',
    },
    {
      '@type': 'Offer',
      name: '구독 (연간)',
      price: '19900',
      priceCurrency: 'KRW',
      description: '모든 과세연도 무제한 + 해지 후에도 기존 PDF 영구 다운로드',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
        <a href="#main" className="skip-link">본문으로 건너뛰기</a>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
