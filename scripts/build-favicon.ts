/**
 * app/icon.svg → app/favicon.ico 재생성 스크립트.
 *
 * 모던 브라우저는 Next file convention 이 emit 하는 `app/icon.svg`(image/svg+xml)
 * 를 쓰지만, 레거시 클라이언트(구형 안드로이드·IE·일부 RSS 리더)와 일부 검색
 * 크롤러(Naver Yeti 등)는 `/favicon.ico` 를 하드코딩으로 요청한다. 이 파일이
 * 없으면 404 → Naver Search Advisor "접근 불가한 페이지" 로 분류된다.
 *
 * icon.svg 를 단일 source 로 16·32·48px PNG 를 렌더해 ICO 컨테이너(Vista+
 * PNG-in-ICO 형식)에 임베드한다. icon.svg 변경 시 `npm run favicon:build` 로
 * 재생성한다.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SIZES = [16, 32, 48];
const SVG_PATH = join(process.cwd(), 'app/icon.svg');
const OUT_PATH = join(process.cwd(), 'app/favicon.ico');

async function main() {
  const svg = readFileSync(SVG_PATH);

  // density 384 = 16px 타깃을 충분히 선명하게 (96dpi 기준 4배 supersample).
  const pngs = await Promise.all(
    SIZES.map((size) =>
      sharp(svg, { density: 384 }).resize(size, size).png().toBuffer(),
    ),
  );

  const count = pngs.length;

  // ICONDIR: reserved(2)=0, type(2)=1(icon), count(2)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  // ICONDIRENTRY × count (각 16 bytes) + 뒤이은 PNG 데이터.
  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  pngs.forEach((png, i) => {
    const size = SIZES[i];
    const e = i * 16;
    entries.writeUInt8(size >= 256 ? 0 : size, e + 0); // width (0 = 256)
    entries.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
    entries.writeUInt8(0, e + 2); // palette color count (0 = no palette)
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // color planes
    entries.writeUInt16LE(32, e + 6); // bits per pixel
    entries.writeUInt32LE(png.length, e + 8); // image data size
    entries.writeUInt32LE(offset, e + 12); // offset from file start
    offset += png.length;
  });

  const ico = Buffer.concat([header, entries, ...pngs]);
  writeFileSync(OUT_PATH, ico);
  console.log(
    `favicon.ico written: ${ico.length} bytes (${SIZES.join('/')}px from app/icon.svg)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
