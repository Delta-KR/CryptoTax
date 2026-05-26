---
description: React Email 개발 서버를 띄워 emails/*.tsx 를 실시간으로 미리보기
---

# Preview Email Templates

React Email 미리보기 서버를 실행하라.

## 실행

```bash
npm run email:dev
```

브라우저에서 http://localhost:3001 열기.

## 주의

- 미리보기에서는 `confirmUrl`/`resetUrl` 기본값이 `{{ .ConfirmationURL }}` 등 Supabase 변수 그대로 표시됨. 실제 발송에는 Supabase가 변수를 치환한다.
- 개발 서버는 background 프로세스로 띄우고, 작업 완료 후 종료할 것.
- 정적 HTML 미리보기는 `emails/preview/index.html` 을 브라우저로 직접 열어도 됨 (의존성 없이).
