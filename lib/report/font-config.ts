import { Font } from '@react-pdf/renderer';
import path from 'node:path';
import fs from 'node:fs';

let registered = false;

export function ensureFontRegistered(): void {
  if (registered) return;
  // ttf 사용 — PR #86~#88 의 woff2 + Node 24 RangeError 회피.
  // fontkit 의 woff2 decompressor 가 Node 24 DataView 환경에서 깨지는 문제 (`Offset is
  // outside the bounds of the DataView`) 우회. ttf 는 압축 없는 raw 폰트라 decompressor
  // 경로를 건드리지 않음. variable ttf 1 파일로 모든 weight 자동 처리.
  const fontPath = path.join(
    process.cwd(),
    'node_modules/pretendard/dist/public/variable/PretendardVariable.ttf',
  );

  if (!fs.existsSync(fontPath)) {
    throw new Error(
      `[font-config] Pretendard ttf not found at ${fontPath} ` +
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
