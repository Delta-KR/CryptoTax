/**
 * React Email 컴포넌트를 정적 HTML/Plain text로 빌드한다.
 *
 * 출력:
 *   emails/dist/verify-email.html       — Supabase Auth Email Templates에 붙여넣기
 *   emails/dist/verify-email.txt        — Plain text 대안
 *   emails/dist/reset-password.html
 *   emails/dist/reset-password.txt
 *   emails/dist/welcome.html            — 자체 트리거용 (Resend SDK / Auth Hook에서 사용)
 *   emails/dist/welcome.txt
 *
 * 실행:
 *   npx tsx scripts/build-emails.ts
 *
 * Supabase Custom SMTP via Resend 패턴:
 *   1) Supabase Dashboard → Project Settings → Auth → SMTP Settings 에서
 *      Resend SMTP 자격증명 입력 (host: smtp.resend.com, port: 465, user: resend, pass: API key)
 *   2) Supabase Dashboard → Auth → Email Templates 에서 각 템플릿에
 *      verify-email.html / reset-password.html 내용을 붙여넣기
 *   3) Welcome 메일은 Supabase 흐름이 아니므로 별도로 Resend SDK 호출
 */

import { render } from '@react-email/render';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import VerifyEmail, { verifyEmailPlainText } from '../emails/verify-email';
import ResetPasswordEmail, {
  resetPasswordPlainText,
} from '../emails/reset-password';
import WelcomeEmail, { welcomePlainText } from '../emails/welcome';

const DIST = path.join(process.cwd(), 'emails', 'dist');

interface Template {
  name: string;
  /** React component instance (defaults baked in) */
  component: React.ReactElement;
  /** Plain text version */
  text: string;
  /** Supabase 변수가 들어가야 하는지 — true면 빌드 후 보정 단계에서 일부 토큰 복원 */
  isSupabaseTemplate: boolean;
}

const templates: Template[] = [
  {
    name: 'verify-email',
    component: VerifyEmail({}),
    text: verifyEmailPlainText({ confirmUrl: '{{ .ConfirmationURL }}' }),
    isSupabaseTemplate: true,
  },
  {
    name: 'reset-password',
    component: ResetPasswordEmail({}),
    text: resetPasswordPlainText({ resetUrl: '{{ .ConfirmationURL }}' }),
    isSupabaseTemplate: true,
  },
  {
    name: 'welcome',
    component: WelcomeEmail({}),
    text: welcomePlainText({}),
    isSupabaseTemplate: false,
  },
];

/**
 * React Email render() 가 URL 안의 `{{ }}` 를 escape 하는 경우가 있다.
 * Supabase Go template 변수는 raw 형태로 유지되어야 하므로 후처리로 복원.
 */
function restoreSupabaseVars(html: string): string {
  return html
    // href, src 속성 내부의 escape된 형태를 복원
    .replace(/%7B%7B/g, '{{')
    .replace(/%7D%7D/g, '}}')
    .replace(/%20\.ConfirmationURL%20/g, ' .ConfirmationURL ')
    .replace(/%20\.Email%20/g, ' .Email ')
    .replace(/%20\.Token%20/g, ' .Token ')
    .replace(/%20\.SiteURL%20/g, ' .SiteURL ')
    .replace(/%20\.RedirectTo%20/g, ' .RedirectTo ')
    // HTML 본문 내부에 들어간 경우 (text node)
    .replace(/&#x7B;&#x7B;/g, '{{')
    .replace(/&#x7D;&#x7D;/g, '}}')
    .replace(/&lcub;&lcub;/g, '{{')
    .replace(/&rcub;&rcub;/g, '}}');
}

/**
 * srcdoc 속성 안에 박을 HTML escape.
 * - `&` 가장 먼저 (다른 entity와 충돌 방지)
 * - `"` 다음 (srcdoc 속성 닫는 따옴표와 충돌)
 *
 * `<`, `>` 는 HTML attribute value 안에서 raw 허용 (HTML5 spec).
 */
function escapeForSrcdoc(html: string): string {
  return html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * preview/index.html 의 두 iframe(`data-src`) 속성을 dist HTML 의 `srcdoc` 속성으로
 * 치환한 self-contained preview 를 만든다. Launch preview / file:// / 어떤
 * sandbox 환경에서도 iframe 내용이 보이도록.
 */
async function buildSelfContainedPreview(
  verifyHtml: string,
  resetHtml: string,
): Promise<void> {
  const previewSrcPath = path.join(
    process.cwd(),
    'emails',
    'preview',
    'index.html',
  );
  const previewOutPath = path.join(DIST, 'index.html');
  const src = await readFile(previewSrcPath, 'utf-8');
  const verifyEscaped = escapeForSrcdoc(verifyHtml);
  const resetEscaped = escapeForSrcdoc(resetHtml);

  const built = src
    .replace(
      /(<iframe\b[^>]*\bid="frame-verify"[^>]*?)data-src="[^"]*"([^>]*>)/,
      `$1srcdoc="${verifyEscaped}"$2`,
    )
    .replace(
      /(<iframe\b[^>]*\bid="frame-reset"[^>]*?)data-src="[^"]*"([^>]*>)/,
      `$1srcdoc="${resetEscaped}"$2`,
    );

  await writeFile(previewOutPath, built, 'utf-8');
  const kb = (Buffer.byteLength(built) / 1024).toFixed(1);
  console.log(`  ✓ ${'index.html (preview)'.padEnd(20)} ${kb} KB  [self-contained]`);
}

async function main() {
  if (!existsSync(DIST)) {
    await mkdir(DIST, { recursive: true });
  }

  console.log('Building email templates...\n');

  const rendered: Record<string, string> = {};

  for (const tpl of templates) {
    const htmlRaw = await render(tpl.component, { pretty: true });
    const html = tpl.isSupabaseTemplate ? restoreSupabaseVars(htmlRaw) : htmlRaw;
    rendered[tpl.name] = html;

    const htmlPath = path.join(DIST, `${tpl.name}.html`);
    const textPath = path.join(DIST, `${tpl.name}.txt`);

    await writeFile(htmlPath, html, 'utf-8');
    await writeFile(textPath, tpl.text, 'utf-8');

    const htmlKb = (Buffer.byteLength(html) / 1024).toFixed(1);
    const tag = tpl.isSupabaseTemplate ? '[Supabase template]' : '[Resend SDK]';
    console.log(`  ✓ ${tpl.name.padEnd(20)} ${htmlKb} KB  ${tag}`);
  }

  await buildSelfContainedPreview(
    rendered['verify-email'],
    rendered['reset-password'],
  );

  console.log(`\nOutput: ${DIST}`);
  console.log('\nNext steps:');
  console.log('  - verify-email.html / reset-password.html → Supabase Auth → Email Templates');
  console.log('  - welcome.html → 자체 코드에서 Resend SDK로 발송 (lib/email/send.ts)');
  console.log('  - index.html → 좌우 비교 미리보기 (라이트/다크/시스템 토글, self-contained)');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
