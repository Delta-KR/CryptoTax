import { Font } from '@react-pdf/renderer';
import path from 'node:path';

let registered = false;

export function ensureFontRegistered(): void {
  if (registered) return;
  const fontPath = path.join(
    process.cwd(),
    'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  );
  Font.register({
    family: 'Pretendard',
    src: fontPath,
  });
  registered = true;
}
