import { ImageResponse } from 'next/og';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDaysUntilTaxStart } from '@/lib/dday';

// Auto-generated OpenGraph image for the whole site. Next.js convention:
// 파일명이 opengraph-image.tsx 면 자동으로 og:image / twitter:image에 등록.

// fs.readFile로 로고 SVG 임베드 — Edge runtime은 fs 미지원이라 nodejs 명시.
export const runtime = 'nodejs';
export const alt = 'Kontaxt — 2027년 가상자산 양도소득세 완벽 대비';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const dday = getDaysUntilTaxStart();
  // Pretendard Bold for Korean text rendering (satori는 woff/ttf/otf 지원, woff2 미지원)
  const fontData = await fetch(
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff'
  ).then((r) => r.arrayBuffer());

  // 다크 배경(#0B1220) 위에 흰색 로고 — public/logo-dark.svg를 빌드 시 base64 inline.
  const logoSvg = await fs.readFile(
    path.join(process.cwd(), 'public', 'logo-dark.svg'),
    'utf-8',
  );
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B1220',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          color: 'white',
          fontFamily: 'Pretendard',
        }}
      >
        {/* Top: D-237 pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 22px',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 999,
            alignSelf: 'flex-start',
            fontSize: 22,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: '#A7F3D0',
              boxShadow: '0 0 0 4px rgba(167,243,208,0.4)',
            }}
          />
          2027년 1월 1일 과세 시행 · D-{dday}
        </div>

        {/* Middle: logo mark + headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SVG viewBox가 정사각이라 그대로 박으면 위아래 공백이 큼.
              negative margin으로 시각 영역만 노출. */}
          <img
            src={logoDataUri}
            width={360}
            height={360}
            alt="Kontaxt"
            style={{ marginLeft: -72, marginTop: -72, marginBottom: -72 }}
          />
          <div
            style={{
              fontSize: 42,
              opacity: 0.95,
              maxWidth: 980,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            거래소 데이터 통합 + 한국 세법 자동 계산
          </div>
        </div>

        {/* Bottom: exchanges + url */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
          }}
        >
          <div style={{ opacity: 0.9, display: 'flex', gap: 14 }}>
            <span>업비트</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>빗썸</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>바이낸스</span>
          </div>
          <div style={{ fontSize: 18, opacity: 0.7 }}>
            kontaxt.kr
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Pretendard',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );
}
