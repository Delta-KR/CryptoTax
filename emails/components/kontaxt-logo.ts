// Base64로 인라인 임베드된 Kontaxt 워드마크.
// 외부 호스팅(`https://kontaxt.kr/logo.svg`)이 메일 클라이언트에서 잘 보이지 않는
// 이슈를 피하기 위해 data URL로 직접 박아 어디서나 표시되도록 한다.
//
// 다크모드는 `filter: brightness(0) invert(1)` 로 자동 반전 (검은 워드마크 → 흰색).
//
// 원본 자산: emails/assets/kontaxt-logo.b64.txt (PNG 워드마크)
// 빌드/런타임: Node 환경에서 fs.readFileSync로 동기 로드. React Email render는
// 항상 server context이므로 OK. 테스트 환경(vitest)에서도 fs 사용 가능.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let _cache: string | null = null;

function loadLogoBase64(): string {
  if (_cache) return _cache;
  const path = join(process.cwd(), 'emails/assets/kontaxt-logo.b64.txt');
  const raw = readFileSync(path, 'utf-8').replace(/\s+/g, '');
  _cache = `data:image/png;base64,${raw}`;
  return _cache;
}

export const KONTAXT_LOGO_DATA_URL = loadLogoBase64();
export const KONTAXT_LOGO_WIDTH = 120;
export const KONTAXT_LOGO_HEIGHT = 25;
