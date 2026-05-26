---
description: Kontaxt 이메일 템플릿을 정적 HTML로 빌드. emails/*.tsx → emails/dist/*.html
---

# Build Email Templates

이메일 템플릿을 빌드하고 결과를 보고하라.

## 실행 단계

1. `npm run email:build` 실행
2. `emails/dist/` 의 결과 파일 목록과 각 파일 크기 출력
3. `verify-email.html` 과 `reset-password.html` 안에 Supabase 변수 (`{{ .ConfirmationURL }}` 등) 가 보존됐는지 grep으로 확인
4. `welcome.html` 안에는 Supabase 변수가 없어야 함 (자체 발송용) — 확인
5. 사용자에게 다음 단계 안내:
   - Supabase Dashboard → Auth → Email Templates 로 가서 `verify-email.html` / `reset-password.html` 내용을 붙여넣을 것
   - Welcome 메일은 `app/auth/callback/route.ts` 안에서 `sendWelcomeEmail()` 호출 필요

## 변경 시 주의

- 새 Supabase 변수 (예: `{{ .Token }}`, `{{ .SiteURL }}`) 를 컴포넌트에 추가했다면, `scripts/build-emails.ts` 의 `restoreSupabaseVars()` 함수에도 escape 복원 패턴을 추가해야 한다.
- 빌드 결과 디렉토리는 gitignored. 매번 빌드해서 사용한다.
