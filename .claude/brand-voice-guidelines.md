# Kontaxt 브랜드 보이스 가이드

이 문서는 Kontaxt의 모든 사용자-노출 텍스트(랜딩 카피, 앱 UI, 이메일, 에러 메시지, 약관·개인정보처리방침, 푸터 마이크로카피)에 적용되는 **언어 표준**입니다.

새 카피를 쓸 때, 기존 카피를 수정할 때, 그리고 `brand-voice:enforce-voice` 스킬이 호출될 때 이 문서를 단일 source of truth로 참조합니다.

DESIGN.md가 **시각** 디자인 가이드라면, 이 문서는 **언어** 디자인 가이드입니다. 두 문서는 같은 5대 원칙을 공유합니다.

---

## 0. 한 줄 디렉션 (2026-05-25 Tier 3 갱신)

> **차분한 정확함 + 친근한 안내. 한국어 우선, 컨텍스트별 톤 mix, 마침표로 닫는다.**

타깃은 한국 가상자산 투자자 — 전문가도 회계사도 아닌 일반 보유자. **신뢰·친근감을 동시에**: 정확함은 격식으로 보여주고 (Security·Legal·Email), 안내·약속은 친밀로 풀어낸다 (Hero·CTA·Marketing·FAQ·Guide). 광고 puffing 은 여전히 0건 유지.

레퍼런스 (한국 핀테크 reference 통합):
- **토스** (toss.im) — 사용자 1인칭("내") + 해요체 + 약속 hook. Hero·CTA 친밀 톤의 정점.
- **카카오뱅크** (kakaobank.com) — 1인칭 + 격식·친밀 mix. 신뢰 + 따뜻함.
- **Mercury / Obsidian / Rogo** — 시각 신뢰 시그널 (DESIGN.md §1).

이전 표준 (격식 -습니다 통일, 무인칭만)은 토스·카카오뱅크 대비 "soulless AI 톤" 으로 인식되어 Tier 3 톤 mix 로 전환.

---

## 1. 5대 보이스 원칙 (Tier 3 갱신)

1. **에디토리얼 단문 헤드라인** — 한 문장. 마침표·물음표로 닫는다. "내 가상자산 양도세, 한 번에 정리해요."
2. **컨텍스트별 톤 mix** — 마케팅·CTA·Guide·FAQ·Sample = **해요체** ("-해요", "-할 수 있어요", "-해 보세요"). Security·Legal·Footer disclaimer·Email = **격식** (-습니다). 같은 페이지 안에서도 위치별로 톤 결정. (Q2 (a)→(c) 갱신, 자세한 매트릭스는 §3·§10)
3. **출처가 보이는 신뢰** — 근거 있는 숫자·법조항(시행령 §88①)·기관명 인용. 막연한 권위·puffing 금지 ("최고의", "압도적인", "혁신적인"). 친밀 톤이라도 광고 puffing 은 0건 유지.
4. **사용자 1인칭 + 무인칭 + Kontaxt mix** — Hero·Sample·CTA 헤드라인에 "내·나의" 허용 ("내 가상자산 양도세", "내 데이터로"). 보안·소유 명시는 "본인" (security 카드·trust-strip·legal). 본문 기본은 무인칭. "Kontaxt가" 는 행위 주체로만 ("계산은 Kontaxt가 대신 해요"). **"당신" 금지** (Q3 유지, 광고 소유격 광고 톤).
5. **언어 차원의 AI 티 제거** — **두 방향 동시**: 방향 ① 광고 puffing (§9 안티패턴 29개 그대로) + 방향 ② **soulless 격식** (sterile·voiceless writing — humanizer PERSONALITY AND SOUL 절). 토스·카카오뱅크 같은 reference 의 인간미 톤 차용으로 ② 해소.

---

## 2. 화자 / 페르소나 / POV

### 화자

**무인칭이 기본.** "거래내역 파일은 즉시 폐기됩니다." 처럼 행위만 서술.

행위 주체를 명시해야 할 때만 **"Kontaxt가"** 사용:
- "복잡한 계산은 Kontaxt가 대신 합니다." ([how-it-works.tsx:135](components/sections/how-it-works.tsx:135))
- "Kontaxt가 통일" ([problem.tsx:266](components/sections/problem.tsx:266))
- "Kontaxt가 자동으로 적용합니다." ([guide/page.tsx:102](app/(marketing)/guide/page.tsx:102))

**"본 서비스" / "회원"** 은 **법률 문서(legal/)에서만** 사용:
- [privacy/page.tsx:51-53](app/(marketing)/legal/privacy/page.tsx:51) — "Kontaxt(이하 "서비스")는..."
- [terms/page.tsx:62](app/(marketing)/legal/terms/page.tsx:62) — "본 약관은 ... 규정함을 목적으로 합니다."

법률 격식이 필요해서 의도된 차이다. 마케팅 카피에 "본 서비스" 누출 금지.

### 청자 (Reader) — Q3 정책 (e) 갱신 (Tier 3)

**2인칭 "당신" 금지 유지** (광고 소유격 톤 회피). **사용자 1인칭 "내·나의" 허용** (Tier 3 추가) — 토스·카카오뱅크 reference 패턴. 보안·소유 명시는 **"본인"** (코드베이스 표준).

| 형태 | 예시 | 판정 |
|------|------|------|
| 광고 소유격 "당신의 X" | "당신의 데이터는 어떻게 보호돼요?" | ❌ — humanizer §9-B H17 광고 톤 |
| 직접 호명 "당신은 ~세요" | "당신은 파일만 올리세요." | ❌ — 주어 생략 |
| **사용자 1인칭 "내·나의"** (Tier 3) | "내 가상자산 양도세, 한 번에 정리해요." ([hero:263](components/sections/hero.tsx:263)) · "내 데이터는 어떻게 보호돼요?" ([security:104](components/sections/security.tsx:104)) · "지금 가입하면 내 데이터로." ([sample:146](app/(marketing)/sample/page.tsx:146)) | ✅ — Hero·Section Title·Sample CTA |
| 무인칭 | "파일만 올리세요." / "계산은 Kontaxt가 대신 해요." | ✅ — 본문 기본 |
| "본인" (소유·접근 명시) | "본인 데이터만 접근" ([security.tsx:37](components/sections/security.tsx:37)) · "본인 데이터 격리 (RLS)" ([trust-strip:33](components/sections/trust-strip.tsx:33)) · "본인 자료로 똑같은 리포트" ([sample:53](app/(marketing)/sample/page.tsx:53)) | ✅ — 보안 컨텍스트 표준 |

**원칙**: Hero·Sample·CTA 헤드라인 = "내/나의" / 본문 = 무인칭 / 보안·소유 = "본인" / "Kontaxt가" = 행위 주체 / **"당신" = 사용 금지**.

**금지**: "여러분", "고객님", "○○님" 자칭. 현재 0건 — 0건 유지.

이메일은 예외 — `${userName}님` 호명 OK ([welcome.tsx:26](emails/welcome.tsx:26) "userName님, Kontaxt에 오신 것을 환영합니다.").

---

## 3. 종결어 — 컨텍스트별 mix (Q2 (a)→(c) Tier 3 갱신)

### 핵심 — 위치별 톤 결정

| 컨텍스트 | 표준 종결어 | 예시 |
|---------|-------------|------|
| **Hero H1** | 해요체 + 마침표 | "내 가상자산 양도세,<br/>한 번에 정리해요." ([hero.tsx:263](components/sections/hero.tsx:263)) |
| **Hero subhead** | 해요체 | "5월 신고할 때 PDF 한 장만 챙기면 돼요." ([hero.tsx:268](components/sections/hero.tsx:268)) |
| **Hero chips** | 단어형·-없어요 | "신용카드 필요 없어요" / "결과 먼저 보고 결정" / "2분이면 끝" ([hero.tsx:305-307](components/sections/hero.tsx:305)) |
| **Section Title (마케팅)** | 해요체·물음표 | "거래소마다 형식이 달라도 너무 달라요." / "내 데이터는 어떻게 보호돼요?" / "3단계, 2분이면 끝나요." |
| **Section Lead** | 해요체 | "엑셀로 합치다 보면 반나절은 그냥 가요." ([problem.tsx:241](components/sections/problem.tsx:241)) |
| **Card body (Features·HowItWorks 등)** | 해요체 | "같은 코인을 다른 거래소로 옮긴 것도 알아서 추적해요." ([features.tsx:19](components/sections/features.tsx:19)) |
| **Security card body** | **-습니다 (격식 유지)** | "업로드한 거래내역 파일은 계산 직후 폐기합니다." ([security.tsx:17](components/sections/security.tsx:17)) — 보안 신뢰 톤 |
| **Pricing tier desc** | 해요체 | "결제 전에 결과 미리 볼 수 있어요." ([pricing.tsx:28](components/sections/pricing.tsx:28)) |
| **Pricing 부가 안내** | 해요체 | "단일은 5월 신고 시즌 1회 결제용이에요." ([pricing.tsx:165](components/sections/pricing.tsx:165)) |
| **FAQ Q** | 의문문 (-나요?) | "안전한가요?" / "어떻게 처리되나요?" |
| **FAQ A** | 해요체 | "처리 끝나면 바로 폐기돼요." ([guide:94](app/(marketing)/guide/page.tsx:94)) |
| **Guide steps** | 해요체·-주세요 | "끌어다 놓으세요." / "받아져요." ([guide UPBIT_STEPS](app/(marketing)/guide/page.tsx:20)) |
| **CTA H2** | 해요체·-보세요 | "지금 무료로 시작해 보세요." ([cta.tsx:52-56](components/sections/cta.tsx:52)) |
| **CTA Lead** | 해요체 | "신용카드 없어도 1분이면 끝나요. 결과 먼저 보고 결정해도 돼요." ([cta.tsx:57](components/sections/cta.tsx:57)) |
| **Footer description** | 해요체 | "한국 가상자산 투자자를 위한 세금 정산 도구예요." ([footer.tsx:52](components/sections/footer.tsx:52)) |
| **Footer disclaimer (법적)** | **-습니다 (격식 유지)** | "본 서비스는 세무 신고의 참고 자료를 제공하며, 최종 신고는 세무사 검토를 권장합니다." ([footer.tsx:93](components/sections/footer.tsx:93)) |
| **Email H1** | -주세요·-합니다 | "이메일 주소를 확인해 주세요." / "Kontaxt에 오신 것을 환영합니다." |
| **Email body** | -습니다 + 자연 -네요 mix | "Kontaxt 가입을 시작하셨네요." ([verify-email.tsx:45](emails/verify-email.tsx:45)) / "본인 것인지 확인해 주세요." |
| **Legal (privacy/terms)** | **-합니다 (격식 절대 유지)** | "본 약관은 ... 규정함을 목적으로 합니다." (Q6 결정) |
| **Microcopy / chip / pill** | 단어형 또는 명사형 | "한국 PIPA 준수", "본인 데이터 격리 (RLS)" — 라벨 형식 |

### 명령형 — 부드러운 -보세요 / -주세요

CTA·안내·행동 요청. Tier 3 에서는 **"-해 보세요"** 가 표준 (이전 강한 "-하세요" 보다 부드럽게).

- "시작해 보세요." ([cta.tsx:55](components/sections/cta.tsx:55), [guide CTA](app/(marketing)/guide/page.tsx:367))
- "골라 보세요." ([pricing.tsx:144](components/sections/pricing.tsx:144))
- "끌어다 놓으세요." / "올려 주세요." (Guide steps)
- "확인해 주세요." (이메일 — 격식 유지)

### 명사형 단정 — chip·badge·label

라벨 형식엔 명사형:
- "거래내역 비저장" / "결제정보 비저장" ([security.tsx:17,80](components/sections/security.tsx:17))
- "한국 PIPA 준수" ([trust-strip.tsx:11](components/sections/trust-strip.tsx:11))
- "지금 사용 가능" ([exchanges.tsx:124](components/sections/exchanges.tsx:124))

### 헤지 vs 단정

- **사실은 단정**: "폐기돼요", "저장돼요" / 격식 컨텍스트는 "폐기됩니다"
- **옵션·선택지는 헤지**: "~할 수 있어요", "~될 수 있어요"
- **약속은 단정 + 근거**: "본인 데이터만 접근 가능합니다." (RLS 근거 — security 격식)

**금지** (Tier 3에서도 유지):
- 사실 단정에 헤지 끼우기 — "처리될 수도 있어요" (사실은 처리됨) → "처리돼요"
- 광고 puffing 형용사 chain ("강력하고 정확하며 신뢰할 수 있는" 등 §9 안티패턴 29개)
- 강박 명령 + 느낌표 ("지금 바로 시작하세요!" → "지금 무료로 시작해 보세요.")

---

## 4. 문장 길이

### 헤드라인 (Hero H1, Section Title, Email Subject)

**한 문장, 6~16자, 마침표 또는 명사형.** 두 줄 이상은 `<br />`로 의도적 줄바꿈.

| 길이 | 예시 |
|------|------|
| 짧음 (6~10자) | "이용약관" ([terms:51](app/(marketing)/legal/terms/page.tsx:50)), "한국 세법, 빠짐없이 반영" ([features.tsx:161](components/sections/features.tsx:161)) |
| 표준 (10~14자) | "가상자산 양도세, 정확하게." ([hero:263-265](components/sections/hero.tsx:263)), "지금 무료로 시작하세요." (권장) |
| 길음 (14~20자) | "상황에 맞게 한 번만 선택하세요" ([pricing:144](components/sections/pricing.tsx:144)) — 상한선 |

**금지**: 20자 초과, 두 문장 이상, 형용사 chain.

### Section Lead (헤드라인 아래 보조 카피)

**1~2 문장, 35~70자.** 절대 3 문장 넘기지 말 것. (DESIGN.md §9 규정)

| 모범 | 예시 |
|------|------|
| 1문장 | "한국 핀테크 표준을 기본으로, 보관하지 않을 데이터는 처음부터 받지 않습니다." ([security:108-110](components/sections/security.tsx:108)) |
| 2문장 | "세무사가 검수하고, 개발자가 만든 계산 엔진. 누락 없이 정확하게." ([features:163-165](components/sections/features.tsx:163)) |

**드리프트 예시**: [pricing:146-150](components/sections/pricing.tsx:146) — 3 문장. **수정 권고**: 2 문장으로 압축.

### 본문 / 카드 설명

**1~2 문장, 50~100자.** 정보 밀도가 높은 카드(Features, How-it-works step)는 한 문장에 fact 1~2개.

### FAQ Answer

**1~3 문장, 60~150자.** Fact 우선, 부가 설명은 한 문장.

**드리프트 예시**: [guide:94](app/(marketing)/guide/page.tsx:94) — 3 문장으로 약간 길음. 보안 답변이라 정당화 가능하지만 문장 1개로 압축 가능.

### Legal Clause

**길이 제약 없음** — 법조항 인용·정확한 정의를 위해 1 문장이 길어지는 게 자연스럽다. 단, **한 호(條) 안에서 의미 단위로 줄바꿈** (privacy/terms 패턴).

### Micro-copy (chip, button, badge)

**4~12자.** 단어형 OK.
- "신용카드 불필요" ([hero:305](components/sections/hero.tsx:305))
- "2분만에 첫 결과" ([hero:307](components/sections/hero.tsx:307))
- "출시 알림 받기" ([pricing:41](components/sections/pricing.tsx:41))
- "결제 전 미리보기 무료" ([hero:306](components/sections/hero.tsx:306))

---

## 5. 한·영 혼용 규칙

### 영어가 OK인 경우

1. **고유명사** — 거래소(Upbit, Binance, Bybit, OKX, Bitget, Coinbase, Gate.io), 회사(Supabase, Vercel, Resend, PortOne, Cloudflare), 결제(Kakao, Naver, Google)
2. **금융·기술 약어** — PDF, CSV, XLS, KRW, USDT, USD, BTC, ETH, SOL, XRP, FIFO, MA, TLS, RLS, HTTPS, SPF, DKIM, DMARC, API
3. **섹션 eyebrow** — `SECURITY`, `PRICING`, `HOW IT WORKS`, `FAQ`, `LEGAL`, `USER GUIDE` (UPPERCASE + tracking)
4. **거래소 컬럼명 그대로 인용** — "Date(UTC)", "Side", "Order Type" (Binance CSV 실제 헤더) ([problem.tsx:213-220](components/sections/problem.tsx:213))
5. **이메일 부제** — H1 한국어 아래 영문 한 줄 (`subtitleEn`): "Please verify your email." ([verify-email.tsx:34](emails/verify-email.tsx:34))

### 한국어 옆 영어 보조 (괄호·sub)

거래소 카드: 한국어 메인 + 영문 sub
- "업비트 / Upbit · 한국 원화 거래소" ([guide:306](app/(marketing)/guide/page.tsx:305))
- "바이낸스 / Binance · 글로벌 거래소 (Spot 전용)" ([guide:318](app/(marketing)/guide/page.tsx:318))

### 영어 마케팅 용어 — 한국어 + 영문 병기 (2026-05-25 Q4 결정)

본문 한국어 흐름 안에 영문 마케팅 용어가 들어가면 **한국어 메인 + 괄호 영문 병기** 가 표준.
- ❌ [pricing.tsx:166](components/sections/pricing.tsx:166) — "Tax-Loss Harvesting 알림" (영문 단독)
- ✅ "절세 매도 알림 (Tax-Loss Harvesting)" (병기 — 신뢰·검색·식자공 모두 잡음)

영문만 사용 OK인 짧은 라벨: chip, badge, table header, 거래소·회사 고유명사, 표준 금융·기술 약어(PDF·CSV·KRW·BTC 등 §5 첫 절 참조).

### 영어 동사·형용사 본문 삽입 금지

- ❌ "스마트한 자동화"
- ❌ "심플하게 정리"
- ❌ "리스크를 헷지"
- ✅ "자동으로 정리합니다", "위험을 줄입니다"

### 스타일

영문 용어는 **as-is** — 따옴표·이탤릭·코드 폰트 일반적으로 사용 X. 예외:
- **mono font 적용 대상**: 파일명, 컬럼명, 명령어, URL 일부 — `.csv`, `BTCUSDT`, `tax_report_홍길동.pdf`
- 코드/명령어는 backtick

---

## 6. 구두점·줄바꿈

### 마침표 — 헤드라인 표준 (현재 위반 多)

**규정** (DESIGN.md §9): 헤드라인은 마침표 있는 한 문장.

**현재 코드 준수율**:
- ✅ Hero H1: "가상자산 양도세, 정확하게." ([hero:263-265](components/sections/hero.tsx:263))
- ✅ Hero "정확하게" / 명사형 단정
- ✅ 이메일 H1 (verify/reset/welcome) — 모두 마침표
- ❌ **거의 모든 Section Title 마침표 누락**:
  - [problem.tsx:233-237](components/sections/problem.tsx:233) — "형식이 전부 다릅니다" (마침표 X)
  - [security.tsx:103-107](components/sections/security.tsx:104) — "어떻게 보호되나요" (마침표·물음표 X)
  - [features.tsx:161](components/sections/features.tsx:161) — "빠짐없이 반영" (마침표 X)
  - [exchanges.tsx:113](components/sections/exchanges.tsx:112) — "거래소 지원" (마침표 X)
  - [pricing.tsx:144](components/sections/pricing.tsx:144) — "선택하세요" (마침표 X)
  - [cta.tsx:53-55](components/sections/cta.tsx:53) — "시작하세요" (마침표 X)
  - [roadmap.tsx:108](components/sections/roadmap.tsx:108) — "시작해야 하는 이유" (마침표 X)
  - [example.tsx:167-169](components/sections/example.tsx:167) — "이렇게 됩니다" (마침표 X)
  - [how-it-works.tsx:131](components/sections/how-it-works.tsx:131) — "끝납니다" (마침표 X)
  - [guide:243-245](app/(marketing)/guide/page.tsx:243) — "단계별 안내" (마침표 X)

**정책 확정** (2026-05-25 Q1 결정): **모든 사용자-노출 H1·H2에 마침표 또는 물음표 통일.** 의문문이면 물음표, 평서·명령은 마침표. eyebrow(uppercase SECURITY/PRICING)와 chip/badge는 면제. 위 10건 모두 drift fix 대상.

### 콤마 (,)

평범한 한국어 콤마 사용. 헤드라인 단문에서 호흡 분리:
- "가상자산 양도세, 정확하게." ([hero:263](components/sections/hero.tsx:263))
- "한국 세법, 빠짐없이 반영" ([features:161](components/sections/features.tsx:161))
- "같은 BTC 매수인데, 거래소마다" ([problem:234](components/sections/problem.tsx:234))

### Middle dot (·)

**라벨·태그 구분자로 사용.** 마침표 대용 아님.
- "PDF · KRW · 한글" ([problem:259](components/sections/problem.tsx:259))
- "Kontaxt · 가상자산 양도세 정산 · 발신 전용" ([EmailLayout:158](emails/components/EmailLayout.tsx:158))
- "신용카드 없이 1분 가입. 결제 전 결과 미리보기까지 무료입니다." ← 여기서는 일반 마침표 (문장)

규칙: **세 개 이상의 동등한 라벨이 나열될 때만 ·**. 두 개면 슬래시 / 또는 쉼표.

### Em dash (—)

**보조 정보·정의·동격에 사용.**
- "예시 통합 결과 — 247건" ([features:118](components/sections/features.tsx:118))
- "연말 손실 정리 시뮬레이션 — 세금이 얼마나 달라지는지 미리 확인" ([roadmap:50](components/sections/roadmap.tsx:50))
- "이번 업로드 결과 — 247건"

**금지**: dramatic reveal ("결과는 — 놀라웠습니다."). AI 티 시그너처.

### Slash (/)

영문 약어·단위·옵션 구분에만:
- "Light / Dark"
- "Spot/Futures"
- "/ 년" ([pricing:37](components/sections/pricing.tsx:37))

### `<br />` (의도된 줄바꿈)

**H1 운율 분리·강조 단어 분리에 사용.**
- "가상자산 양도세,<br />**정확하게.**" ([hero:263-265](components/sections/hero.tsx:263))
- "당신의 데이터는<br />어떻게 보호되나요" ([security:104-106](components/sections/security.tsx:104))
- "지금 무료로<br />**시작하세요**" ([cta:53-55](components/sections/cta.tsx:53))

본문에는 의도된 줄바꿈 거의 사용 X. footer의 두 문장 분리는 예외 ([footer:53-55](components/sections/footer.tsx:53)).

### 생략·여운

- ✅ **"등"** — 일관 사용 ("PDF·CSV·XLS 등")
- ❌ **"…" / "..."** — 사용 금지. 현재 코드 0건. 유지.
- ❌ **".." (두 점)** — 사용 금지.

### 이모지 — 완전 금지 (2026-05-25 Q5 결정)

**모든 이모지 사용 금지** (DESIGN.md §8 명시). 안전 기호(⚠ ✓ ✗ 등) 예외 없음. 모두 SVG 아이콘으로 대체.

**현재 위반**:
- [guide.tsx:325](app/(marketing)/guide/page.tsx:325) — `"⚠ Futures(선물)..."` warning emoji 사용. **drift fix 대상**: SVG warn 아이콘으로 교체. 같은 컴포넌트가 `tone: 'warn'` prop으로 컬러 배경 처리 중이라 emoji 중복.

기호 ●, ◯, ✓도 텍스트 안에서 사용 금지. 모두 SVG로.
- ✅ [security.tsx:217](components/sections/hero.tsx:217) "● 계산 완료" — 디자인 시각 요소(green dot)이고 텍스트는 한국어. 회색 영역. **유지하되 더 안전한 SVG dot로 마이그레이션 고려**.

### 느낌표 (!)

**금지** (DESIGN.md §9 명시). 현재 코드 0건. 유지.

---

## 7. 숫자 · 단위 · 날짜

### 한국어 숫자 표기 (만 단위)

DESIGN.md §9 규정: `1,550만` / `₩49,900`. K/M 약식 금지.

| 패턴 | 적용 |
|------|------|
| `₩49,900` | 가격 정확 표기 ([terms:134](app/(marketing)/legal/terms/page.tsx:134)) |
| `₩89,000/년` | 정기 결제 |
| `+₩2,120만` | 큰 금액 (만 단위 요약) ([hero:224](components/sections/hero.tsx:224)) |
| `−₩250만` | 마이너스는 `−` (U+2212), `-` (hyphen) 아님 |
| `1,550만` | 사용자 수 ([cta:88](components/sections/cta.tsx:88)) — 5대 거래소 합산 1,559만, `docs/business-plan.md` §3 (2024.11). TAM(중복 제거 보유자) 1,150~1,250만은 별도 지표 |
| `247건` | 거래 건수 |
| `20%` / `22%` | 세율 (DESIGN.md §12: 소득세 20% + 지방세 2% 분리 표기) |

**금지**: `$10K`, `1.5M`, `15500000` (raw, 마케팅 카피에). 표·데이터 행에서는 raw OK.

### CSS — `.num` 클래스

숫자가 들어가는 모든 곳: `font-variant-numeric: tabular-nums` (DESIGN.md §4).

### 날짜

| 패턴 | 사용처 |
|------|--------|
| `2027.01.01` | 마케팅 헤드라인·badge (점 구분, 한국어 톤) ([hero badge](components/sections/hero.tsx:14)) |
| `2026년 5월 22일` | 법률 문서 시행일 (한글 풀어쓰기) ([privacy:11](app/(marketing)/legal/privacy/page.tsx:11)) |
| `2027년 귀속` | 회계 연도 ([hero:211](components/sections/hero.tsx:211)) |
| `2028년 5월 신고` | 신고 시즌 |
| `2026.Q4` | 출시 분기 ([pricing:42](components/sections/pricing.tsx:42)) |
| `2027/01/15`, `2027.01.15`, `2027-01-15` | 거래소 mock data (의도된 거래소별 quirk) — UI 외부 데이터는 거래소 형식 그대로 |

### D-day

**`D-{n}` 형식 통일**. 마침표·물음표·이모지 금지.
- "2027.01.01 시행 · D-237" ([hero badge](components/sections/hero.tsx:14))
- "첫 신고까지 D-{dday}" ([cta:12](components/sections/cta.tsx:12))
- "과세 시행까지 D-{daysUntilLaw}" ([welcome.tsx:46](emails/welcome.tsx:46))

차분한 톤 유지 (DESIGN.md §4). "**D-237!**" 처럼 강조 금지.

### 단위 부호

- `%` 앞 공백 없음: `20%`
- `₩` 뒤 공백 없음: `₩49,900`
- 마이너스는 `−` (U+2212), `-` (hyphen) 아님: `−250만`
- 플러스는 `+` 그대로
- 범위는 `~` (틸드): `2026년 7월 ~ 9월` ([exchanges:137](components/sections/exchanges.tsx:137))

---

## 8. 어휘 — 선호 / 회피 / 금지

### 선호 동사 (이미 사용 중)

| 동사 | 사례 |
|------|------|
| 정확하게 / 정확한 / 정확합니다 | [features:35,165](components/sections/features.tsx:35), [hero:265](components/sections/hero.tsx:265) |
| 자동으로 / 자동 계산 / 자동 적용 / 자동 인식 | 곳곳 |
| 한 번에 / 한 화면에 / 한 파일에 | [hero:268](components/sections/hero.tsx:268), [features:38](components/sections/features.tsx:38), [guide:249](app/(marketing)/guide/page.tsx:248) |
| 그대로 (변환 없이) | [footer:55](components/sections/footer.tsx:55), [guide:16](app/(marketing)/guide/page.tsx:16) |
| 미리 (확인·예측) | [pricing:149](components/sections/pricing.tsx:149), [roadmap:50](components/sections/roadmap.tsx:50) |
| 즉시 / 빠짐없이 / 누락 없이 | [security/](components/sections/security.tsx), [features:161,165](components/sections/features.tsx:161) |
| 폐기 / 비저장 / 받지 않습니다 | security 패턴 |

### 선호 명사

| 명사 | 사례 |
|------|------|
| 거주자 / 비거주자 | 법령 정확 |
| 총평균법 (시행령 §88①) | example, features |
| 의제취득가액 | features:29, guide:102 |
| 양도소득세 / 양도차익 / 과세표준 / 납부세액 / 기본공제 | 표준 세무 용어 |
| 거래내역 / 거래소 / 계산 결과 / 리포트 | 일상어 |
| 보호·격리·암호화 | 보안 |

### 회피 — Soft 금지 (사용 시 정당화 필요)

| 단어 | 이유 |
|------|------|
| "솔루션" | 한국 마케팅 클리셰. 0건 유지. |
| "원스톱" | 의미 약함. "한 번에"로 대체. |
| "스마트한" / "스마트" | "자동으로" / "한국 세법 기준으로"가 더 구체적. |
| "차원이 다른" | 자극적·근거 약함. |
| "최적화된" | 측정 가능한 표현으로 ("처리 3초", "247건"). |
| "초간단" / "초고속" | 접두사 "초"는 광고 톤. |
| "혁신" / "혁신적" | 0건 유지. |
| "압도적" | 0건 유지. |
| "완벽한" / "완벽하게" | 사실 확인 불가. "정확하게"로 대체. |
| "최고의" / "최고" | 0건 유지. |
| "강력한" / "강력하고" | 0건 유지. |
| "신뢰할 수 있는" | 보여줘야지 말로 하면 광고. "암호화", "RLS"처럼 근거 제시. |
| "정말" / "매우" / "굉장히" / "엄청" | 무의미한 강조어. |
| "이제" 시작 (예: "이제 더 이상 ~") | 카피라이팅 시그너처. |
| "단 한 번의 클릭으로" | 영문 직역 ("with just one click"). |
| "걱정 없이" / "고민 끝" | 광고 톤. "자동으로 적용됩니다"가 더 명확. |

### 금지 — Hard 금지 (사용 0건 유지)

| 표현 | 대안 |
|------|------|
| "고객님" / "회원님" / "○○님" 자칭 호명 (마케팅) | 무인칭 또는 "당신" (절제) |
| "여러분" | 무인칭 |
| "Are you tired of...?" 직역 → "~에 지치셨나요?" | "한국 세법 기준으로 자동 계산합니다." (행동 서술) |
| "더 이상 ~할 필요가 없습니다" | "자동으로 처리합니다." |
| "여러분이 원하는 모든 것" | 구체적 기능 명시 |
| "지금 바로!" + "!" | "지금 무료로 시작하세요." (마침표) |
| "○○ 부터 ○○ 까지 모든 것" (catch-all 표현) | 핵심 기능 2~3개 나열 |
| "꿀팁" / "꿀템" / "갓-" 접두사 | 모든 사용 금지 — 톤 충돌 |
| "찐" / "찐텐" | 신조어 금지 |
| 이모지 (🎉 ✨ 🚀 💎 🔥 등) | DESIGN.md §8 |
| "!" (느낌표) | 마침표 / 명사형 |

---

## 9. 언어 차원 AI 안티패턴 (DESIGN.md §8의 언어 버전)

DESIGN.md §8이 시각 안티패턴 10가지를 정의한다면, 이 절은 **언어 안티패턴 28가지**를 정의한다 (Kontaxt 한국어 특화 12개 + humanizer 통합 16개). 새 카피 작성·리뷰 시 이 패턴이 나타나면 즉시 교체.

### 9-A. Kontaxt 한국어 특화 12

| ❌ 패턴 | 왜 AI 티 | 대안 |
|---------|----------|------|
| **형용사 chain** ("강력하고 정확하며 신뢰할 수 있는") | ChatGPT가 형용사를 쌓는 디폴트 | 하나만 ("정확하게.") |
| **메타-설명 헤드라인** ("Kontaxt는 한국 가상자산 양도소득세 계산 서비스입니다") | LLM이 정의문으로 답을 시작하는 습관 | 행동·결과 ("가상자산 양도세, 정확하게.") |
| **"여러분의 [형용사] [명사]를 [동사]하세요" 템플릿** | 영문 광고 직역 시그너처 | "거래내역을 업로드하세요." |
| **"더 이상 ~할 필요가 없습니다"** | "No more need to..." 직역 | "자동으로 처리합니다." |
| **"단 한 번의 클릭으로"** | "with just one click" 직역 | "한 번 클릭으로" 또는 그 표현 자체 회피 |
| **"~에 지치셨나요?" 의문형 마케팅** | "Are you tired of..." 직역 | 사실·증거로 시작 ("한국 투자자 평균 2.4개 거래소 사용.") |
| **Em-dash dramatic reveal** ("결과는 — 놀라웠습니다.") | LLM이 사용하는 호흡 트릭 | em-dash는 정의·동격에만 |
| **3-item list as a tic** (모든 답변·소개가 항상 3개) | LLM 디폴트 리듬 | 2개·4개·5개도 자연스러우면 사용 |
| **무의미한 강조어 ("정말", "매우", "굉장히")** | 영어 "really, very" 직역 | 삭제 또는 구체적 수치 |
| **"이제 / 이제는" 시작** ("이제 한국 세법, 한 번에.") | "Now you can..." 직역 | 시간 표시 없이 직접 사실 |
| **"~의 새로운 표준" / "차세대"** | 광고 클리셰 | 기능 자체 서술 |
| **느낌표(!) 남발** | 강조의 인플레이션 | 마침표 또는 명사형 |

### 9-B. humanizer 통합 패턴 16개 (2026-05-25 추가)

[blader/humanizer](https://github.com/blader/humanizer) Claude Code 스킬 ([.claude/skills/humanizer/SKILL.md](.claude/skills/humanizer/SKILL.md))의 29개 패턴 중 한국어 적용 가능한 16개를 Kontaxt 컨텍스트로 옮긴 것. 영어 위주 패턴 (title case·hyphenated word pairs·curly quotes 등)은 제외.

| # | ❌ 한국어 AI 티 패턴 | Before (피해야 할 예시) | After (대안) |
|---|---------------------|----------------------|------------|
| **H1** | **Significance puffing** ("역사적 전환점", "기념비적 순간", "획기적인 진보") | "이번 가이드는 한국 가상자산 세무의 역사적 전환점입니다." | "이번 가이드는 2027년 1월부터 시행되는 양도세 정산 방법을 정리한 것입니다." |
| **H2** | **Vague attributions** ("전문가들에 따르면", "업계에서는", "다수의 관계자가") | "업계 전문가들에 따르면 가상자산 세무는 점점 복잡해지고 있습니다." | "기획재정부 시행령 §88①에 따라 거주자는 총평균법으로 산정합니다." |
| **H3** | **Challenges-and-Future 단락** ("도전과제와 미래 전망: 다양한 도전 직면, 미래는 밝") | "도전과제와 미래 전망: 한국 가상자산 시장은 다양한 도전에 직면해 있지만, 미래는 밝습니다." | (이 단락 자체 제거 — 막연한 도전·전망 단락은 정보 0) |
| **H4** | **Copula avoidance** ("역할을 합니다", "자리잡고 있습니다", "기능합니다") | "Kontaxt는 한국 가상자산 양도세 정산의 핵심 도구로 자리잡고 있습니다." | "Kontaxt는 한국 가상자산 양도세 정산 도구입니다." |
| **H5** | **Negative parallelism** ("단순한 X가 아니라 Y", "X뿐만 아니라 Y") | "단순한 계산기가 아니라 종합 정산 플랫폼입니다." | "거래 통합·환율 변환·PDF 리포트까지 한 번에 처리합니다." |
| **H6** | **Elegant variation / 동의어 cycling** ("도구 / 플랫폼 / 솔루션 / 서비스 / 시스템" 한 단락 안에 다 등장) | "Kontaxt는 도구입니다. 본 플랫폼은 ... 본 솔루션은 ... 이 시스템은 ..." | "Kontaxt는 도구입니다. 이 도구는 ..." (반복 자연스러움) |
| **H7** | **False ranges** ("X부터 Y까지 모두" — X·Y가 한 척도가 아님) | "신규 투자자부터 전문 트레이더까지, 단순 매수부터 복잡한 파생거래까지 모두 다룹니다." | "현물 거래(매수·매도·교환)를 지원합니다. 파생상품은 미지원." |
| **H8** | **Inline-header lists** (불릿마다 굵게 헤더 + 콜론으로 시작) | "- **속도**: 빠릅니다.<br>- **정확성**: 정확합니다.<br>- **편의성**: 편합니다." | 단락으로 풀어쓰기 — "총평균법(시행령 §88①)으로 계산해 3초 안에 결과가 나옵니다." |
| **H9** | **Collaborative artifacts** ("도움이 되셨길 바랍니다", "더 필요하시면 알려주세요", "추가 질문 환영합니다") | "위와 같이 정리해 드렸습니다. 도움이 되셨길 바랍니다. 추가 질문 있으시면 알려주세요." | (이런 문장 자체 삭제 — 본문에 사용자-챗봇 대화체 금지) |
| **H10** | **Knowledge-cutoff disclaimers** ("정확한 정보는 제한적이지만", "공개된 자료를 기반으로", "현재 기준으로는") | "정확한 일정은 확인되지 않았지만, 2027년 시행될 가능성이 있습니다." | "2027년 1월 1일부터 시행됩니다 (소득세법 §37의2)." |
| **H11** | **Sycophantic tone** ("좋은 질문입니다", "정말 좋은 지적입니다", "탁월한 관점입니다") | "Q. 의제취득가액이 뭔가요? <br>A. 좋은 질문입니다! 정말 중요한 부분을 잘 짚으셨습니다. ..." | "A. 2026년 12월 31일 이전 매수분의 취득가액을 ..." (사실로 시작) |
| **H12** | **Filler phrases** ("위해서는", "에 대해", "다음과 같은 사항을 고려할 필요가") | "양도세 신고를 하기 위해서는 다음과 같은 사항을 고려해야 할 필요가 있습니다." | "양도세 신고 시 확인할 것:" |
| **H13** | **Generic positive conclusions** ("밝은 미래", "큰 도약", "성장의 길") | "Kontaxt와 함께 더 나은 세무 관리의 길로 나아가세요. 밝은 미래가 기다리고 있습니다." | (이 단락 삭제 — 사실로 닫기) "2027년 1월 1일 시행 D-237." |
| **H14** | **Persuasive authority tropes** ("본질적으로", "핵심은", "정말 중요한 것은", "결국") | "본질적으로 중요한 것은 정확성입니다." | "정확하게 계산합니다." |
| **H15** | **Signposting** ("이제 살펴봅시다", "한번 알아볼까요", "다음으로 넘어가서") | "이제 한국 양도세 계산 방식을 살펴보겠습니다." | (안내 없이 바로) "한국 양도세는 총평균법으로 산정합니다." |
| **H16** | **Fragmented headers** (헤더 + 헤더 재진술 문장 + 본문) | "## 보안<br><br>보안은 중요합니다.<br><br>업로드한 파일은 ..." | "## 보안<br><br>업로드한 파일은 메모리에서 즉시 폐기됩니다." |
| **H17** | **"당신의 X" 광고 소유격 + 의문문** (한국어 특화, humanizer 외) | "당신의 데이터는 어떻게 보호되나요?" ("Are you wondering about your X?" 직역체) | "데이터는 어떻게 보호되나요?" (무인칭) 또는 "본인 데이터는 어떻게 보호되나요?" (소유 명시) |

### 검출 명령

새 카피에 위 28개 패턴이 들어갔는지 빠르게 확인하려면 §12 작성 체크리스트의 grep 3종을 사용한다. humanizer 스킬 자체를 호출하면 더 정교한 의역까지 가능:

```bash
# Claude Code 스킬로 호출 (project-local vendor)
/humanizer

# 또는 brand-voice:enforce-voice 스킬과 결합
```

**언어 안티패턴 일괄 검출 명령** (수동 grep):
```bash
grep -rEn "여러분|고객님|솔루션|혁신|압도적|완벽한|최고의|강력한|단 한 번|이제 더 이상|걱정 없이|차원이 다른|꿀팁|꿀템|찐텐|!|역사적 전환점|기념비적|자리잡고 있|역할을 합니다|단순한 .* 아니라|밝은 미래|큰 도약|본질적으로|핵심은|이제 살펴|한번 알아|좋은 질문|도움이 되셨길|도움이 되길 바랍|필요하시면 알려" \
  components app/\(marketing\) emails \
  --include="*.tsx" --include="*.ts"
```

이 grep이 **0건**이면 통과. 적중 시 케이스별로 판단 후 교체.

---

## 10. 컨텍스트별 톤 매트릭스 (Tier 3 갱신)

각 사용자-노출 컨텍스트의 표준 형식·길이·종결·예시. **친밀 (해요체) vs 격식 (-습니다)** 컨텍스트가 명시되어 있음.

| 컨텍스트 | 톤 | 길이 | 종결 | 화자 | 모범 사례 |
|----------|-----|------|------|------|-----------|
| **Hero H1** | 친밀 | 8~16자, 1문장, `<br/>` OK | 해요체 + 마침표 | **"내·나의"** 사용자 1인칭 | "내 가상자산 양도세,<br/>한 번에 정리해요." ([hero:263](components/sections/hero.tsx:263)) |
| **Hero Subhead** | 친밀 | 1~2문장, 30~60자 | -해요 / -돼요 | 무인칭 / "Kontaxt가" | "Upbit·Bithumb·Binance 다 한 번에. 5월 신고할 때 PDF 한 장만 챙기면 돼요." ([hero:268](components/sections/hero.tsx:267)) |
| **Hero CTA 버튼** | 친밀 | 5~10자 | -하기 / -받기 / -보기 | 사용자 행동 | "무료로 시작하기", "샘플 리포트 보기" |
| **Hero Check chip** | 친밀 | 5~12자 | 단어형·-없어요 | 사실 | "신용카드 필요 없어요", "결과 먼저 보고 결정", "2분이면 끝" ([hero:305-307](components/sections/hero.tsx:305)) |
| **Section Eyebrow** | (없음) | 영문 UPPERCASE 4~16자 | (없음) | 카테고리 | "SECURITY", "PRICING", "HOW IT WORKS", "USER GUIDE" |
| **Section Title (마케팅)** | 친밀 | 8~20자, 1문장 | 해요체 + 마침표/물음표 | 무인칭 / **"내"** / 의문 — "당신의 X" 금지 | "거래소마다 형식이 달라도 너무 달라요." ([problem:236](components/sections/problem.tsx:236)) · "내 데이터는<br/>어떻게 보호돼요?" ([security:104](components/sections/security.tsx:104)) · "3단계, 2분이면 끝나요." |
| **Section Lead (마케팅)** | 친밀 | 1~2문장, 35~80자 | -해요 / -돼요 / -가요 | 무인칭 | "엑셀로 합치다 보면 반나절은 그냥 가요." ([problem:241](components/sections/problem.tsx:241)) |
| **Card Title (h3)** | (없음) | 4~14자 | 명사형 | 사실 | "거래내역 비저장", "여러 거래소, 한 번에 통합" |
| **Card Body — 마케팅 (features·how-it-works 등)** | 친밀 | 1~2문장, 30~100자 | -해요 / -돼요 | 무인칭 / Kontaxt | "자동으로 형식을 맞춰서 합쳐 줘요." ([features.tsx:19](components/sections/features.tsx:19)) |
| **Card Body — Security** | **격식** | 1~2문장, 30~80자 | **-습니다** (신뢰 톤) | 무인칭 | "업로드한 거래내역 파일은 계산 직후 폐기합니다. 계산 결과는 본인 브라우저에만 저장됩니다." ([security:17](components/sections/security.tsx:17)) |
| **Button Primary** | 친밀 | 5~10자 | -하기 / -받기 / -보기 / -보세요 | 행동 | "무료로 시작하기", "출시 알림 받기" |
| **Button Secondary** | 친밀 | 5~12자 | -보기 / -이동 / 명사 | 행동 | "샘플 리포트 보기", "요금제 비교" |
| **Trust strip label** | (없음) | 4~12자 | 명사형 (소유 명시 = "본인") | 사실 | "한국 PIPA 준수", "Cloudflare 봇 차단", "본인 데이터 격리 (RLS)" |
| **Pricing tier name** | (없음) | 1~6자 | 명사 | 카테고리 | "무료", "구독", "원타임" |
| **Pricing tier desc** | 친밀 | 1문장, 25~80자 | -해요 / -이에요 | 무인칭 | "결제 전에 결과 미리 볼 수 있어요." ([pricing:28](components/sections/pricing.tsx:28)) |
| **FAQ Q** | 친밀 | 6~20자, 1문장 | 물음표 -나요? | 사용자 발화 | "제 거래내역 데이터는 안전한가요?" ([guide:93](app/(marketing)/guide/page.tsx:93)) |
| **FAQ A** | 친밀 | 1~3문장, 60~150자 | -해요 / -돼요 | 무인칭 / Kontaxt | "처리 끝나면 바로 폐기돼요. 계산 결과는 본인 브라우저(localStorage)에만 저장되고, 서버나 외부로는 안 보내요." ([guide:94](app/(marketing)/guide/page.tsx:94)) |
| **Guide steps** | 친밀 | 1~2문장, 30~100자 | -해요 / -주세요 / -돼요 | 사용자 행동 + 무인칭 | "거래소에서 받은 PDF나 CSV 파일을 그대로 끌어다 놓으세요. 형식·거래소는 자동으로 알아봐요." ([guide FLOW_STEPS](app/(marketing)/guide/page.tsx:132)) |
| **CTA H2** | 친밀 | 8~14자 | 해요체 + 마침표 | 무인칭 | "지금 무료로<br/>시작해 보세요." ([cta:52-56](components/sections/cta.tsx:52)) |
| **CTA Lead** | 친밀 | 1~2문장 | -해요 / -돼요 | 무인칭 | "신용카드 없어도 1분이면 끝나요. 결과 먼저 보고 결정해도 돼요." ([cta:57](components/sections/cta.tsx:57)) |
| **Footer link** | (없음) | 3~14자 | 명사 | 카테고리 | "보안 개요", "취약점 신고", "이용약관" |
| **Footer description** | 친밀 | 1문장 | -이에요 / -예요 | 무인칭 | "한국 가상자산 투자자를 위한 세금 정산 도구예요." ([footer:52](components/sections/footer.tsx:52)) |
| **Footer disclaimer (법적)** | **격식** | 1문장, 30~80자 | **-합니다** (법적 안전망) | 무인칭 | "본 서비스는 세무 신고의 참고 자료를 제공하며, 최종 신고는 세무사 검토를 권장합니다." ([footer:93](components/sections/footer.tsx:93)) |
| **Footer disclaimer 작은 라인** | 친밀 | 1문장 | -어요 / -아요 | 카테고리 | "일정은 진행 상황에 따라 바뀔 수 있어요 · 본 정보는 세무 조언이 아니에요." ([roadmap:128](components/sections/roadmap.tsx:128)) |
| **Email Subject (Preview)** | 격식 | 1문장, 20~40자 | -주세요 / -합니다 | 무인칭 | "이메일 주소를 확인해 주세요. 60분 안에 인증해 주세요." |
| **Email Eyebrow** | (없음) | 영문 UPPERCASE | (없음) | 카테고리 | "EMAIL VERIFICATION", "PASSWORD RESET", "WELCOME" |
| **Email H1** | **격식** | 1문장, 8~20자 | **마침표 필수** | 무인칭 / Kontaxt | "이메일 주소를 확인해 주세요." / "Kontaxt에 오신 것을 환영합니다." |
| **Email Body** | 격식 + 자연 mix | 1~2 paragraph | -습니다 / -네요 / -주세요 | 무인칭 | "Kontaxt 가입을 시작하셨네요." ([verify-email.tsx:45](emails/verify-email.tsx:45)) / "본인 것인지 확인해 주세요." |
| **Email CTA 버튼** | 격식 | 4~10자 | -하기 / 명사 | 행동 | "이메일 인증하기", "비밀번호 재설정", "대시보드로 이동" |
| **Email footer** | (없음) | 1문장 | 명사형 | 카테고리 | "Kontaxt · 가상자산 양도세 정산 · 발신 전용" |
| **Legal H1** | (없음) | 4~10자 | (없음) | 카테고리 | "이용약관", "개인정보처리방침" |
| **Legal Article 제목** | (없음) | 4~14자 | (없음) | 카테고리 | "정의", "환불 정책", "서비스의 책임 제한" |
| **Legal Clause** | **격식 (절대)** | 1문장 길게 OK | **-합니다** | "서비스" / "회원" | 격식 법률문 형식. 한 호 안에서 의미 단위 줄바꿈 OK |
| **Error message** | 친밀 mix | 1문장, 20~50자 | -주세요 / -없어요 | 무인칭 | "이메일 주소를 다시 확인해 주세요." (가이드 제안) |
| **Empty state** | 친밀 | 1~2문장 | -해요 / -주세요 | 무인칭 | "아직 업로드한 거래내역이 없어요. 거래소 파일을 끌어다 놓아 주세요." (가이드 제안) |
| **Toast** | 친밀 | 1문장, 10~40자 | -됐어요 / -완료 | 사실 | "리포트가 다운로드됐어요." (가이드 제안) |

---

## 11. We Are / We Are Not (Tier 3 갱신)

| ✅ We Are | ❌ We Are Not |
|-----------|--------------|
| 차분한 정확함 + 친근한 안내 | 들뜬 자신감 또는 차가운 격식 |
| 컨텍스트별 톤 mix (마케팅 친밀 / 법률 격식) | 격식만 통일 (soulless AI 톤) 또는 친밀만 (신뢰 깎임) |
| 한국어 우선, 영어는 보조 | 한·영 혼용 마케팅 직역 |
| 사용자 1인칭 ("내·나의") 헤드라인 + 무인칭 본문 + "본인" 소유 | "당신의 X" 광고 소유격 + "여러분·고객님" 자칭 |
| 단문 + 마침표 헤드라인 (해요체 + 마침표 OK) | 마침표 없는 슬로건 또는 강박 명령 + 느낌표 |
| 출처·근거 명시 (시행령 §88①, RLS, PIPA) | 막연한 권위 ("업계 최고") |
| 무인칭 본문, 행위 주체로만 "Kontaxt가" | "Kontaxt는 ... 입니다" 자기소개 본문 |
| 자동·정확·즉시·한 번에 (사실) | 혁신·완벽·최고·압도적 (puffing) |
| 숫자 풀어쓰기 (1,550만 / ₩49,900) | K·M 약식 (1.5M / $50K) |
| 한국 세법 용어 풀어쓰기 + 영문 마케팅 용어 병기 ("절세 매도 알림 (Tax-Loss Harvesting)") | 영문 단독 노출 |
| 거래소 quirks를 사실로 서술 | 경쟁사·거래소 비교에서 결론 띄우기 |
| CTA 단계적 노출 (Hero → mid → 마지막), "-해 보세요" 부드러운 권유 | "지금 바로!" 강압 + 느낌표 |
| 보안·컴플라이언스·법률은 격식 절대 유지 (신뢰 톤) | 보안·법률을 친밀로 풀어서 가벼움 노출 |
| 사용자 상황 짚기 ("거래소 두세 개여도", "5월 신고할 때") | "수많은 사용자가 ..." 막연한 사회적 증명 |

---

## 12. 새 카피 작성·수정 체크리스트

새 사용자-노출 텍스트를 작성하거나 기존 카피를 수정할 때:

**작성 전**:
- [ ] 어느 컨텍스트인가? (§10 매트릭스에서 위치 확인)
- [ ] 길이 표준은? 종결어 표준은?

**작성 중**:
- [ ] 헤드라인이면 마침표 (또는 물음표) 있는가
- [ ] 톤이 컨텍스트와 맞는가 — 마케팅·CTA·Guide·FAQ·Sample = 해요체 / Security·Legal·Footer disclaimer·Email = 격식 (-습니다). §10 매트릭스 확인
- [ ] 사용자 인칭 OK 인가 — Hero·Sample H1 = "내·나의" 허용 / 본문 = 무인칭 / 보안·소유 = "본인" / **"당신" = 0건**
- [ ] 영문 마케팅 용어가 단독 노출되는가 → 한국어 병기
- [ ] 숫자는 1,550만 / ₩49,900 형식인가 (K/M 금지)
- [ ] 날짜 형식이 컨텍스트 표준인가 (마케팅 `2027.01.01`, 법률 `2026년 5월 22일`)
- [ ] middle dot `·`은 세 개 이상 라벨 분리에만 사용했는가
- [ ] em dash `—`는 정의·동격에만 사용했는가 (dramatic reveal 금지)
- [ ] 광고 puffing 0건 — §9 안티패턴 29개 그대로 (친밀 톤이라도 puffing은 금지)

**작성 후 — Soft 금지 grep** (§8 + humanizer puffing):
```bash
grep -En "솔루션|스마트한|원스톱|초간단|초고속|혁신|차원이 다른|걱정 없이|고민 끝|꿀팁|꿀템|역사적 전환점|기념비적|큰 도약|밝은 미래|성장의 길" <new-file>
```

**작성 후 — Hard 금지 grep** (§8 + humanizer 챗봇·아첨·signposting):
```bash
grep -En "고객님|여러분|단 한 번의 클릭|이제 더 이상|~에 지치셨나요|!|도움이 되셨길|도움이 되길 바랍|필요하시면 알려|추가 질문 있으|좋은 질문|정말 좋은|이제 살펴|한번 알아|다음으로 넘어" <new-file>
```

**작성 후 — AI 패턴 grep** (§9 + humanizer copula·authority):
```bash
grep -En "강력하고|정확하며|신뢰할 수 있는|완벽한|최고의|압도적|매우|굉장히|정말로|역할을 합니다|자리잡고 있|기능합니다|본질적으로|핵심은|정말 중요한|결국 중요한|단순한 .* 아니라|뿐만 아니라" <new-file>
```

각 grep 0건이면 통과. (의도된 사용이면 컨텍스트 주석 + 카피 리뷰 시 정당화)

**마무리**:
- [ ] DESIGN.md 시각 안티패턴(§8) 동시 점검
- [ ] 라이트/다크 모두 가독성 확인
- [ ] 모바일 375px 화면 줄바꿈 확인
- [ ] (이메일이면) Gmail/Outlook/Apple Mail 미리보기

---

## 13. 정책 결정 (Final)

2026-05-25 사용자 결정으로 다음 9개 정책 확정. 본 문서 본문의 모든 규칙은 아래 결정을 따른다.

| # | 정책 | 결정 |
|---|------|------|
| Q1 | **모든 Section Title 마침표·물음표** | **(a) 전부 추가** — Hero·이메일 H1 외 나머지 SectionTitle 10개 모두 마침표·물음표 부착. drift fix PR에서 일괄 적용. |
| Q2 | **해요체 (-있어요 / -할게요) 사용** | **(c) 컨텍스트별 mix** (2026-05-25 Tier 3 갱신, 이전 (a) "격식 통일" 폐기) — 마케팅·CTA·Guide·FAQ·Sample·Marketing footer = **해요체 표준**, Security 카드 body·Footer 법적 disclaimer·Email H1·Email body·Legal = **격식 -습니다 유지**. 한국 핀테크 reference (토스·카카오뱅크) 친밀 톤 차용으로 "soulless AI 톤" 해소. 자세한 매트릭스는 §3·§10. |
| Q3 | **2인칭 "당신" 사용 빈도** | **(e) "당신" 금지 유지 + 사용자 1인칭 "내·나의" 허용** (2026-05-25 Tier 3 갱신, 이전 (d) "무인칭/본인만") — Hero·Sample H1·Security SectionTitle·Sample CTA 등에 "내 가상자산 양도세", "내 데이터로", "내 데이터는" 허용. 토스·카카오뱅크 reference 패턴 차용. 본문 기본은 여전히 무인칭, 보안·소유는 "본인", "당신"은 광고 소유격 톤이라 0건 유지. |
| Q4 | **영문 마케팅 용어 노출** | **(b) 영문 + 한국어 병기** — "절세 매도 알림 (Tax-Loss Harvesting)" 식. pricing.tsx:166 우선 수정. |
| Q5 | **이모지 정책** | **(a) 완전 금지** — guide.tsx:325 ⚠ 포함 모두 SVG 아이콘으로 대체. 안전 기호(⚠ ✓ ✗) 예외 없음. |
| Q6 | **legal 페이지 카피 톤** | **(a) 현행 유지** — "본 서비스" / "회원" 격식 표기 보존. 의도된 마케팅·법률 격차. |
| Q7 | **금지어 사전 길이** | **(a) ~30개 (현행)** — §8 Hard·Soft 합쳐 약 30개 수준. 광고 클리셰·신조어 위주. 확장은 사용 사례 발생 시 점진 추가. |
| Q8 | **숫자 표기 — 한국식 vs 국제식** | **(a) 마케팅·요약 한국식 (1,550만 / ₩49,900) + 정밀 표·계산기 국제식 (15,500,000)** — 컨텍스트별 분기 유지. |
| Q9 | **voice-check lint 스크립트** | **(b) 사람 리뷰 + brand-voice:enforce-voice 스킬** — 카피 변동 단계라 정적 grep 도입 보류. 향후 마이그레이션 마무리 후 scripts/voice-check.ts 도입 검토. |

---

## 14. 변경 이력

- **2026-05-25 (Tier 3 톤 mix 전환)** — 격식 진영 → 친밀·격식 mix 진영으로 톤 정체성 전환. Q2 (a)→(c) · Q3 (d)→(e) 갱신.
  - **발단**: `/humanizer /insights` 분석에서 Kontaxt 카피가 토스·카카오뱅크 reference 대비 "soulless AI 톤" (sterile, voiceless writing — humanizer PERSONALITY AND SOUL 절) 으로 인식 가능. 광고 puffing (방향 ①) 만 잡고 인간미 부재 (방향 ②) 는 사각지대.
  - **레퍼런스 수집**: 토스 (toss.im) — "내 모든 금융 내역을 한눈에 조회하고 한 곳에서 관리하세요." + "당신의 일상이 새로워질 거예요." (사용자 1인칭 + 해요체 + 약속 hook) / 카카오뱅크 (kakaobank.com) — "나의 첫 번째 AI 은행" + "어려운 계산은 제가 도와드릴게요" (1인칭 + 격식·친밀 mix). 한국 핀테크 톤 두 진영 (친밀 vs 격식) 인지.
  - **새 톤 정의** (§0~§1): 차분한 정확함 + 친근한 안내. 컨텍스트별 mix — 마케팅·CTA·Guide·FAQ·Sample = 해요체 / Security·Legal·Email = 격식 (-습니다). 광고 puffing 은 여전히 0건 유지 (§9 안티패턴 29개 그대로).
  - **카피 일괄 fix** — 15+ 파일:
    - **Hero** (`hero.tsx:263-307`) — H1 "가상자산 양도세, 정확하게." → **"내 가상자산 양도세, 한 번에 정리해요."** + 새 sub + chips 친밀화
    - **Problem** (`problem.tsx:233-242`) — title + lead "거래소마다 형식이 달라도 너무 달라요."
    - **HowItWorks** (`how-it-works.tsx:131-135`) — "3단계, 2분이면 끝나요." + "계산은 Kontaxt가 대신 해요. 파일만 올려 주시면 돼요."
    - **Example** (`example.tsx:167-172`) — "계산은 이렇게 돼요."
    - **Exchanges** (`exchanges.tsx:112-137`) — "국내외 주요 거래소, 다 돼요." + 거래소 구체 명기 + coming-soon 기간 친밀화
    - **Features** (`features.tsx:17-43, 160-165`) — "한국 세법, 빠짐없이." + big "여러 거래소, 한 번에 통합" + 4 small desc 친밀화
    - **Security** (`security.tsx:103-110`) — **"내 데이터는 / 어떻게 보호돼요?"** (사용자 1인칭 도입) + sub "한국 핀테크 표준 그대로. 안 받을 데이터는 처음부터 안 받아요." / 카드 body 는 격식 유지 (신뢰 톤)
    - **Pricing** (`pricing.tsx:23-167`) — "상황에 맞게 골라 보세요." + 3 tier desc + warning + diff card 모두 친밀
    - **Roadmap** (`roadmap.tsx:108-128`) — "지금 준비하면 좋은 이유." + lead + bottom note ("바뀔 수 있어요 · 세무 조언이 아니에요")
    - **CTA** (`cta.tsx:52-95`) — "지금 무료로 / 시작해 보세요." + "신용카드 없어도 1분이면 끝나요." + stats sub 친밀화
    - **Footer** (`footer.tsx:52-55`) — description "도구예요" / 법적 disclaimer (line 93) 격식 유지
    - **Guide** (`app/(marketing)/guide/page.tsx`) — H1·lead·H2·UPBIT_STEPS 6건·BINANCE_STEPS 7건·FLOW_STEPS 4건·FAQ 8건·note 2건·CTA 모두 친밀화
    - **Sample** (`app/(marketing)/sample/page.tsx`) — H1 "홍길동님의 2027년 양도세." + lead + CTA lead 친밀화
    - **Email** (보수적 자연화) — verify-email "Kontaxt 가입을 시작하셨네요." / welcome "예상 세액 미리 확인해 보세요. 결제는 곧 출시돼요. 가입자에게 우선 알림이 가요."
  - **격식 절대 유지** (Tier 3 라도): Security 카드 body · Footer 법적 disclaimer · Email H1 · Legal (privacy/terms) — Q6 결정 유지.
  - **VOICE.md 본문 갱신** (§0·§1·§2·§3·§10·§11·§12·§13 Q2·Q3·§14): 약 350+ 줄 재작성.
  - **광고 puffing 0건 유지**: 친밀 톤이라도 §9 안티패턴 29개·금지어 ~30개 (§8) 그대로 적용. grep 3종 (§12) 통과 의무.

- **2026-05-25 (Q3 정책 갱신)** — "당신" 사용 정책 (b) 절제 사용 → (d) 사용 금지, 무인칭/본인 통일 (이후 Tier 3 에서 (e) 로 재갱신).

- **2026-05-25 (humanizer 통합)** — [blader/humanizer](https://github.com/blader/humanizer) Claude Code 스킬 vendor + VOICE.md §9 한국어 통합.
  - **입력 자산**: DESIGN.md, README.md, CLAUDE.md, emails/* (verify·reset·welcome·EmailLayout), components/sections/* (12개), app/(marketing)/{guide,sample,legal/{privacy,terms}}/page.tsx
  - **추출 패턴**: 페르소나 / 종결어 (격식체 표준, 해요체 3건 드리프트) / 문장 길이 / 한·영 혼용 / 마침표 드리프트 (Section Title 거의 누락) / 숫자 표기 / 어휘 (soft·hard 금지 ~30개) / AI 12가지 언어 안티패턴 / 28개 컨텍스트 매트릭스 / We Are·We Are Not 12행
  - **정책 확정** (§13): 9개 모두 본 가이드 디폴트 채택 — Section Title 마침표 전체 추가 (Q1) · 해요체 격식 통일 (Q2) · "당신" 절제 사용 (Q3) · 영문 마케팅 용어 + 한국어 병기 (Q4) · 이모지 완전 금지 (Q5) · legal 격식 현행 유지 (Q6) · 금지어 ~30개 유지 (Q7) · 한국식/국제식 컨텍스트 분기 (Q8) · voice-check lint 보류, brand-voice:enforce-voice 스킬 + 사람 리뷰 (Q9)
  - **DESIGN.md §9**: 17줄 → 핵심 5개 + VOICE.md 링크로 축약 완료
  - **drift fix 완료**: PR [#57](https://github.com/Delta-KR/kontaxt/pull/57) (`f93e456`) — Section Title 마침표 12건 · 해요체 4건 · 이모지 1건 · Tax-Loss Harvesting 병기 · README 통계 sync (TAM vs 거래소 합산 다른 지표였음 확인)

- **2026-05-25 (Q3 정책 갱신)** — "당신" 사용 정책 (b) 절제 사용 → (d) 사용 금지, 무인칭/본인 통일
  - **발견**: 사용자 지적 — `security.tsx:104` "당신의 데이터는 어떻게 보호되나요?" 가 의문문+소유격 결합으로 광고 톤 ("Are you wondering about your X?" 직역체). 같은 컴포넌트 카드 제목은 "본인 데이터만 접근" 인데 SectionTitle 만 "당신의" — 같은 섹션 안에서도 일관성 깨짐.
  - **정책**: "당신" 모든 형태(주격·소유격) 사용 금지. 보안·소유 명시 필요 시 "본인" (코드베이스 표준 — trust-strip:33 · security:37 · sample:53). 그 외 무인칭.
  - **변경**: §2 청자 절 본문 갱신 · §9-B H17 "당신의 X" 광고 소유격 안티패턴 신규 (28 → 29 패턴) · §10 매트릭스 Section Title 행 인칭 컬럼 명시 · §13 Q3 결정 (d) 로 갱신.
  - **코드 fix 2건**: `security.tsx:104` "당신의 데이터는" → "데이터는" · `how-it-works.tsx:135` "당신은 파일만 올리세요" → "파일만 올리세요" (주어 생략).
- **2026-05-25 (humanizer 통합)** — [blader/humanizer](https://github.com/blader/humanizer) Claude Code 스킬 vendor + VOICE.md §9 한국어 통합.
  - **install**: `.claude/skills/humanizer/` (project-local vendor, .git 제거). 호출 `/humanizer`. Wikipedia "Signs of AI writing" 기반 29개 패턴.
  - **§9 확장**: 9-A (Kontaxt 한국어 특화 12) + 9-B (humanizer 통합 16) = 28개 패턴. humanizer 29개 중 영어 위주 13개(title case·hyphenated word pairs·curly quotes 등)는 제외, 한국어 적용 가능 16개를 한국어 Before/After 예시로 재작성.
  - **§12 grep 3종 보강**: Soft·Hard·AI 각각에 humanizer 신규 키워드 추가 (역사적 전환점/기념비적/자리잡고 있/도움이 되셨길/본질적으로/단순한 X가 아니라 등).
  - **선택**: humanizer 스킬 자체는 영어 카피 (README, business plan, 영문 문서)에 직접 호출 시 강력, 한국어는 VOICE.md §9 + grep 3종으로 충분.
