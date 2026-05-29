import { JetBrains_Mono } from 'next/font/google';

// JetBrains Mono — next/font/google auto self-hosts at build time.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// Pretendard — loaded via globals.css `@import 'pretendard/dist/web/variable/
// pretendardvariable-dynamic-subset.css'`. unicode-range 로 한글 빈도순 92 chunk
// 분할 → Hero "내 가상자산 양도세, 한 번에 정리해요." 같은 첫 paint 텍스트는
// chunk 1-2개만 다운로드 (~50-100KB). Variable 단일 woff2 (2MB) 대신 dynamic
// subset 으로 모바일 LCP 11.9s → ~3-4s 개선. 2026-05-30.
//
// font-family 명: 'Pretendard Variable' (CSS @font-face 가 등록).
// tailwind.config.ts 의 sans stack 에 직접 명시.
