import { Font } from '@react-pdf/renderer';
import path from 'node:path';
import fs from 'node:fs';

let registered = false;

export function ensureFontRegistered(): void {
  if (registered) return;
  const fontPath = path.join(
    process.cwd(),
    'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  );

  // 진단: PR #76 이 outputFileTracingIncludes 로 woff2 를 lambda 에 포함시켰음에도
  // prod /api/report 가 RangeError (Offset is outside the bounds of the DataView) 발생.
  // 두 가지 가능성: (1) outputFileTracingIncludes key 가 next 16 App Router 에서
  // 작동 안 함 → file 자체 lambda 에 없음, (2) file 은 있지만 woff2 decompressor 가
  // Node 24 환경에서 깨짐. existsSync 로 어느 쪽인지 판별.
  if (!fs.existsSync(fontPath)) {
    throw new Error(
      `[font-config] Pretendard woff2 not found at ${fontPath} ` +
        `(cwd=${process.cwd()}). outputFileTracingIncludes 가 lambda bundle 에 ` +
        `포함하지 못함.`,
    );
  }

  Font.register({
    family: 'Pretendard',
    src: fontPath,
  });
  registered = true;
}
