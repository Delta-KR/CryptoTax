import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// JetBrains Mono — next/font/google auto self-hosts at build time.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// Pretendard — variable font from the `pretendard` npm package.
// Path is relative to this file (app/fonts.ts → ../node_modules/...).
// If next/font/local rejects the node_modules path in a future Next.js version,
// copy PretendardVariable.woff2 into app/fonts/pretendard/ and update the path.
export const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
});
