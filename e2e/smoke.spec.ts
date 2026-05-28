import { test, expect } from '@playwright/test';

/**
 * Smoke 테스트 — 인증 불필요한 공개 페이지가 200 + 핵심 텍스트 렌더링 확인.
 *
 * 추가 시나리오 (가입·업로드·계산)는 별도 spec에서 Supabase test 환경 setup 후 진행.
 * 여기서는 마케팅/인증 폼/법률 페이지가 빌드 깨지지 않았음을 보장한다.
 */

test.describe('public pages', () => {
  test('홈 — Hero 헤드라인 렌더링', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
    // VOICE.md Hero 표준 카피.
    await expect(page.getByText('내 가상자산 양도세,')).toBeVisible();
    await expect(page.getByText('한 번에 정리해요.')).toBeVisible();
  });

  test('샘플 리포트 — 손익 섹션 렌더링', async ({ page }) => {
    const res = await page.goto('/sample');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: '코인별 손익' })).toBeVisible();
  });

  test('시뮬레이터 — H1 렌더링', async ({ page }) => {
    const res = await page.goto('/simulator');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: '지금 팔면 세금 얼마.' })).toBeVisible();
  });

  test('가이드 — H1 존재', async ({ page }) => {
    const res = await page.goto('/guide');
    expect(res?.status()).toBeLessThan(400);
    // 가이드는 H1 텍스트가 카피 업데이트에 자주 변경됨 — element 존재만 검증.
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('법률 — 개인정보처리방침 H1 존재', async ({ page }) => {
    const res = await page.goto('/legal/privacy');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('auth pages (unauthenticated)', () => {
  test('로그인 — 폼 요소 + 비밀번호 잊으셨나요 링크', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(page.getByRole('link', { name: /비밀번호를 잊으셨나요/ })).toBeVisible();
  });

  test('가입 — 폼 요소 + 로그인 링크', async ({ page }) => {
    const res = await page.goto('/signup');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel('비밀번호', { exact: true })).toBeVisible();
    // 이미 가입했어요 → 로그인 링크.
    await expect(page.getByRole('link', { name: /로그인/ })).toBeVisible();
  });
});

test.describe('navigation', () => {
  test('홈 → 세금 계산기 라우팅', async ({ page }) => {
    await page.goto('/');
    // Nav·CTA·Footer 어디든 /simulator 로 가는 링크가 있어야 함.
    // 카피는 "세금 계산기" (Nav)·"세금 계산기 (무료)" (Footer).
    const calcLink = page.getByRole('link', { name: /^세금 계산기/ }).first();
    await expect(calcLink).toBeVisible();
    await calcLink.click();
    await expect(page).toHaveURL(/\/simulator$/);
  });
});
