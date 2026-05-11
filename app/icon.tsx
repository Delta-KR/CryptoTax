import { ImageResponse } from 'next/og';

// 자동 favicon 생성. Next.js convention: app/icon.tsx → /icon (32×32 PNG)
// 브랜드 색 + small mono 차트 그래프 SVG.

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 11 L6 6 L9 9 L14 3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="3" r="1.4" fill="white" />
        </svg>
      </div>
    ),
    size
  );
}
