import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke 테스트 전용 Playwright 설정.
 *
 * 목적은 페이지가 200을 반환하고 핵심 텍스트가 렌더링되는지만 확인하는 것.
 * E2E 시나리오(가입→업로드→계산→리포트)는 follow-up으로 별도 디렉토리에 추가.
 *
 * 실행: `npm run e2e` (또는 `npm run e2e:ui`)
 * 첫 실행 전: `npm run e2e:install`로 chromium 다운로드 필요.
 */
export default defineConfig({
  testDir: './e2e',
  // 단순 smoke라 retry 없음. flakiness 발견 시 CI에서만 retry 1회로 추가.
  retries: 0,
  // 페이지 단위가 독립적이라 parallel.
  fullyParallel: true,
  // Vitest와 글로벌 timeout 명시적으로 다르게 — Next dev cold start 여유.
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: 'http://localhost:3000',
    // 실패 시 trace 저장 (디버깅용).
    trace: 'retain-on-failure',
    // 한국어 페이지라 locale 명시.
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // dev 서버 자동 시동. 이미 떠 있으면 재사용.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  // CI에선 html report 생성, 로컬에선 list만.
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
});
