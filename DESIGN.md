# Kontaxt 디자인 가이드

랜딩·앱 전반에 적용하는 시각·인터랙션 원칙. 새 섹션·컴포넌트를 만들 때, 또는 기존 화면을 수정할 때 이 문서를 먼저 참고합니다.

---

## 1. 디렉션 한 줄

> **Mercury의 라이트 미니멀 핀테크 골격 + Obsidian의 에디토리얼 단문 카피 + Rogo의 컴플라이언스 신뢰 시그널.**

타깃은 한국 가상자산 투자자. 신뢰·정확함이 1순위, 화려함은 0순위.

### 적용 레퍼런스
| 레퍼런스 | 차용한 것 |
|---------|----------|
| **[Mercury](https://mercury.com)** | 라이트 모던 미니멀, 단문 슬로건, 풍성한 footer, 컴플라이언스 시각화 |
| **[Obsidian](https://obsidian.md)** | 에디토리얼 한 문장 헤드라인(마침표 사용), 큰 여백, 콘텐츠가 곧 비주얼 |
| **[Rogo](https://rogo.ai)** | Trust strip(컴플라이언스 배지), 보안 가치 카드, 다단계 CTA |

---

## 2. 5대 원칙

1. **에디토리얼 단문 헤드라인** — 헤딩은 마침표 있는 한 문장. "복잡한 한국 양도소득세, 정확하게."
2. **큰 호흡** — section padding과 column gap을 아낌없이. 카드끼리 붙이지 말 것.
3. **콘텐츠가 곧 비주얼** — 장식 효과(블롭·그라디언트·글로우) 금지. dashboard mock·테이블·실제 스크린샷이 메인 비주얼.
4. **신뢰는 디자인으로** — 보안·컴플라이언스를 footnote로 처리하지 말고 시각 섹션으로 노출 (Trust Strip, Security 섹션).
5. **CTA 단계적 노출** — Hero → mid-page → 마지막 CTA 섹션. 한 페이지에 3~4번 자연스럽게 분포.

---

## 3. 컬러

### 토큰 시스템 (`app/globals.css`)
모든 컬러는 RGB triplet CSS 변수로 정의 → Tailwind `rgb(var(--token) / <alpha>)` 패턴으로 alpha 지원.

```css
--brand: 37 99 235;        /* #2563EB — 모든 액센트의 기본 */
--brand-2: 29 78 216;      /* #1D4ED8 — hover, 강조 */
--brand-soft: 238 244 255; /* #EEF4FF — 아이콘 타일 배경 */
--ink: 11 18 32;           /* #0B1220 — 본문/헤딩 */
--ink-2: 31 41 55;         /* #1F2937 — 서브 텍스트 */
--muted: 92 102 120;       /* 본문 보조 */
--muted-2: 138 147 164;    /* 더 옅은 캡션 */
--line / --line-2          /* 보더 */
--bg / --bg-soft / --bg-tint /* 배경 단계 */
--good / --bad / --warn    /* 의미 색 */
```

### 사용 규칙
- **컴포넌트에서 raw hex 금지.** 항상 token 또는 Tailwind alias (`bg-brand`, `text-muted`).
- **단일 brand blue + 중립 그레이만.** 보라(#7C3AED, #8B5CF6) · 인디고(#6366F1) · 시안(#06B6D4) · 오렌지·핑크 사용 금지.
- **거래소 brand color는 예외** — Upbit 파랑, Binance 노랑, Bithumb 주황은 의미가 있으므로 keep.
- **다크모드는 토큰이 자동 처리.** 라이트/다크용 hex를 컴포넌트에 직접 적지 말 것.

---

## 4. 타이포그래피

### 폰트
- **Sans**: Pretendard (한글 최적화), JetBrains Mono (숫자·코드)
- 변수: `var(--font-pretendard)`, `var(--font-jetbrains-mono)`

### Type Scale (`tailwind.config.ts` `fontSize`)
| 토큰 | 사이즈 / 줄높이 / 자간 / 굵기 | 용도 |
|------|------------------------------|------|
| `text-eyebrow` | 12 / 1 / 0.18em / 700 | 섹션 eyebrow (UPPERCASE) |
| `text-body` | 14 / 1.55 | 기본 본문 |
| `text-body-lead` | 18 / 1.6 | 섹션 lead 카피 |
| `text-card-title` / `text-card-title-lg` | 20·24 / 1.3 / -0.02em / 700 | 카드 제목 |
| `text-section-title` | 44 / 1.15 / -0.03em / 800 | 섹션 H2 |
| `text-hero-headline` | 56 / 1.12 / -0.035em / 800 | Hero H1 (현재는 lg:text-[68px]로 더 키움) |
| `text-stat-lg` / `text-stat-xl` / `text-tax-figure` | 32~40 / -0.025em / 800 | 수치 강조 |

### 숫자
- **숫자가 들어가는 모든 곳에 `.num` 클래스** (`font-variant-numeric: tabular-nums`) — 칸 흔들림 방지.

### 줄바꿈
- 한국어는 음절 단위 줄바꿈 방지: `word-break: keep-all` (전역 적용).
- 헤딩에 `<br />`로 의도적인 줄바꿈 OK.

---

## 5. 여백·레이아웃

### Section Padding (`app/globals.css`)
```
section-pad        px-5 py-16  · sm: px-6 py-20  · lg: px-8 py-[120px]
section-pad-hero   px-5 pb-16 pt-12  · lg: pb-24 pt-[88px]
section-pad-footer px-5 pb-8 pt-12  · lg: pb-10 pt-16
```

### Container
- 모든 섹션 안쪽: `mx-auto max-w-content` (= 1240px)
- 카드 그리드는 `max-w-[1080px]` 또는 `max-w-[1140px]` 정도로 한 단계 좁게

### 그리드 간격
- 카드 간 gap: `gap-3` ~ `gap-5` (작은 카드), `gap-4` (표준), `gap-6` (큰 카드)
- Hero 좌우 column gap: `gap-16 lg:gap-20`

### Z-index
- `nav` (sticky): `z-50`
- modal overlay: `z-[60]`
- 그 외 평면 구조 유지 (z-index 남발 금지)

---

## 6. 컴포넌트 패턴

### 카드
```tsx
className="rounded-lg border border-line bg-card p-6 shadow-sm"
```
- **rounded**: `rounded-lg` (16px) 표준, 큰 카드는 `rounded-[18px]`
- **border**: 항상 `border-line` (얇은 1px). 그림자보다 보더로 분리.
- **shadow**: `shadow-sm`만 사용. `shadow-md`/`lg`는 dashboard mock 같은 특수 경우.
- **bg**: `bg-card` 기본. 강조는 `bg-bg-soft` 또는 `border-brand + ring-1 ring-brand/10`.

### 버튼
| 종류 | 클래스 |
|------|--------|
| Primary | `rounded-[10px] bg-brand px-6 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-brand-2` |
| Secondary | `rounded-[10px] border border-line bg-card px-5 py-[15px] text-[15px] font-medium text-ink-2 transition-colors hover:bg-bg-soft` |
| Tertiary (text) | `text-brand transition-colors hover:text-brand-2` |

- 버튼 padding은 primary/secondary 높이 균일하게 맞출 것.
- `transition-colors` 사용. **`transition-all` 금지** (Web Interface Guidelines 위반).

### Pill / Badge
- 작은 정보 라벨: `rounded-full border border-line bg-bg-soft px-3 py-1 text-[11px] font-medium text-muted`
- 강조: `bg-brand-soft text-brand-2` 조합
- 위험: `bg-bad-soft text-bad`, 성공: `bg-good-soft text-good`

### 섹션 헤딩 (`components/ui/section-heading.tsx`)
```tsx
<SectionEyebrow>SECTION NAME</SectionEyebrow>   {/* 12px brand UPPERCASE */}
<SectionTitle>큰 단문 헤드라인</SectionTitle>   {/* 32~44px ink */}
<SectionLead>한 두 문장 보조 카피</SectionLead> {/* 17px muted */}
```

### 아이콘
- **SVG only** (Heroicons 스타일, stroke 1.6~1.8). 이모지 금지.
- 아이콘 컬러는 `currentColor` + 부모에서 `text-brand` / `text-muted` 등으로 제어.
- 아이콘 타일: `h-12 w-12 rounded-md bg-brand-soft text-brand`로 통일.

---

## 7. 인터랙션

### Transition
- **명시적 properties만**: `transition-colors`, `transition-[border-color,box-shadow]`. `transition: all` 절대 금지.
- 기본 duration: 150~200ms. 카드 hover는 200ms ease.

### Hover
- 카드: `.hov` 클래스 (1px lift + border 강조). 헤비한 spotlight·glow 금지.
- 버튼: `hover:bg-brand-2` 같은 색상 전환만.

### Focus
- 글로벌 가드 (`globals.css`):
  ```css
  :focus { outline: none; }
  :focus-visible { outline: 2px solid rgb(var(--brand)); outline-offset: 2px; }
  ```
- 컴포넌트에서 `outline-none` 쓸 때는 반드시 `focus-visible:ring-*`로 대체.

### Motion
- `prefers-reduced-motion: reduce` 사용자에게 transition 끄기 (`globals.css` `.hov`에서 처리).
- 자동 재생 애니메이션·parallax·마우스 추적 효과 금지.

---

## 8. AI 티 안티패턴 — 절대 하지 말 것

다음은 "AI 생성 사이트" 시그니처. 새 컴포넌트에서 발견 시 즉시 제거.

| ❌ | 왜 |
|---|---|
| 글로벌 색상 블롭 / blur 80px+ radial gradient | v0/Lovable 시그니처 |
| 마우스 추적 spotlight | 같은 시그니처 |
| 그라디언트 텍스트 (브랜드→인디고→보라) | "AI purple/pink gradients" |
| 헤비 glassmorphism (backdrop-blur 20px+ + saturate) | iOS 스타일 남발 |
| 노트북 그리드 + radial mask 배경 | v0의 hero overlay 시그니처 |
| 무지개 액센트 (보라+시안+그린+오렌지 동시) | rainbow palette = AI 패턴 |
| 다크 그라디언트 카드 (#1E3A8A → #0F1B3D) | 무거운 그림자와 결합되면 AI 느낌 |
| 이모지를 아이콘으로 사용 | 폰트 의존, 일관성 깨짐 |
| `transition: all` | 성능 이슈 + Web Interface Guidelines 위반 |
| 번쩍이는 inset highlight (`shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]` 강한 alpha) | iOS 노티 스타일 |

---

## 9. 카피 톤 (요약 — 자세한 건 [VOICE.md](VOICE.md))

언어 표준은 별도 문서 [VOICE.md](VOICE.md)에 분리되어 있습니다. **Tier 3 톤 mix 가 Kontaxt 의 공식 브랜드 보이스로 확정** (2026-05-25). 마케팅·랜딩부터 인앱 UI·인증·이메일까지 모든 사용자-노출 텍스트가 이 표준을 따릅니다.

핵심 5개:

1. **마침표 있는 단문 헤드라인** — "내 가상자산 양도세, 한 번에 정리해요."
2. **컨텍스트별 톤 mix** — 친밀 (해요체) 영역: 마케팅·CTA·Guide·FAQ·Sample·(marketing)/simulator·**(app)/* 인앱 UI**·**(auth)/* 인증**·Toast·Error·Empty state. 격식 절대 유지 (-습니다) 6 영역: Security 카드 body·Footer 법적 disclaimer·Email H1·Legal·Report 법적 disclaimer·Example 법조항 인용.
3. **사용자 1인칭 + 무인칭 + Kontaxt mix** — Hero·Sample·CTA "내·나의" 허용, 보안·소유는 "본인", 본문 무인칭, "Kontaxt가" 는 행위 주체로만. **"당신" 금지**.
4. **숫자는 한국식 만 단위 + ₩** — `1,550만` / `₩49,900`. K·M 약식 금지.
5. **이모지·느낌표(!) 금지 + 광고 puffing 금지** — 친밀 톤이라도 §9 안티패턴 29개·금지어 ~30개 그대로 적용.

새 카피·기존 카피 수정 시 반드시 [VOICE.md](VOICE.md) §12 작성 체크리스트 + grep 3종 실행.

---

## 10. 새 섹션·컴포넌트 추가 체크리스트

만들기 전에:
- [ ] 이 섹션이 **5대 원칙** 중 어느 것을 강화하나?
- [ ] 위치는? (Hero → Trust → Problem → How → Example → Exchanges → Features → Security → Pricing → Roadmap → CTA → Footer 흐름 중 어디)

만드는 중:
- [ ] `bg-card` + `border-line` + `shadow-sm` 표준 사용
- [ ] `rgb(var(--*))` 토큰만 사용, hex 금지
- [ ] 아이콘은 SVG, 컬러는 `currentColor`
- [ ] `text-brand`만 액센트, 보라/시안 금지
- [ ] heading은 `SectionEyebrow` + `SectionTitle` + `SectionLead` 패턴
- [ ] `.num` 클래스 숫자에 적용
- [ ] `transition-colors` 사용

마무리:
- [ ] **8장 안티패턴** 다시 점검
- [ ] 라이트/다크 모두 확인
- [ ] 모바일 375px 화면에서 깨지지 않음
- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run build` 통과

---

## 11. 현재 페이지 구조

랜딩 (`app/(marketing)/page.tsx`):
```
Hero          → 단문 헤드라인 + dashboard mock
TrustStrip    → PIPA · Cloudflare · RLS · 결제 비저장 (1줄)
Problem       → 거래소 3개 형식 비교 (3 cards)
HowItWorks    → 3-step 흐름
Example       → 총평균법 단일 시연 (시행령 §88①, 거주자 법정)
Exchanges     → LIVE 2개 + COMING SOON 7개 (중앙정렬)
Features      → Bento grid (1 big + 4 small)
Security      → 3 보안 가치 카드 (Mercury 식)
Pricing       → 3-tier (구독을 brand ring으로 강조)
Roadmap       → 4 단계 카드
CTA           → 단일 카드 + stats 3개
Footer        → 4 컬럼 (브랜드·서비스·보안·고객지원)
```

---

## 12. 변경 이력

- **2026-05-25 (Tier 3 톤 mix)** — §9 카피 톤 5원칙 갱신 — Q2 (a) 격식 통일 → (c) 컨텍스트별 mix · Q3 (d) "당신" 금지 → (e) 사용자 1인칭 "내·나의" 허용. 자세한 매트릭스는 VOICE.md §3·§10 (Tier 3 재작성).
- **2026-05-25** — §9 카피 톤을 별도 문서 [VOICE.md](VOICE.md)로 분리.
  - 분리 이유: 시각 디자인 시스템(DESIGN.md)과 언어 시스템(VOICE.md)을 각자 단일 source로 운영하기 위함. §9가 짧아 페이지·이메일이 늘면서 종결어·마침표·이모지 드리프트가 누적되던 문제 해소.
  - VOICE.md 13개 절: 디렉션 / 5대 보이스 원칙 / 화자·페르소나 / 종결어 표준 / 문장 길이 / 한·영 혼용 / 구두점·줄바꿈 / 숫자·단위·날짜 / 어휘 사전 / AI 언어 안티패턴 12개 / 컨텍스트별 톤 매트릭스 28개 / We Are·We Are Not 12행 / 작성 체크리스트 + grep 명령.
  - DESIGN.md §9는 핵심 5개 + VOICE.md 링크로 축약.
- **2026-05-22 (P2-a)** — 마케팅·UI 정리 (PR 후속).
  - Example 섹션의 FIFO/이동평균 토글 코드 제거. 총평균법 단일 시연으로 변경 (위 §11 페이지 구조 갱신).
  - v2 #2 MA 평균 단가 timeline 제거 (총평균법은 연 1점이라 timeline 의미 약함).
- **2026-05-22 (P1)** — TotalAverageEngine 도입 + v2 #1 FIFO vs MA 비교 카드 제거 ([PR #12](https://github.com/Delta-KR/kontaxt/pull/12)). 거주자 default `'totalAverage'`. FIFO/MA 엔진은 비거주자 모드(§183⑥)용 보존. settings 3카드 + badge.
- **2026-05-22 (P0)** — 세법 정립 기획 변경 사항 기록 ([PR #11](https://github.com/Delta-KR/kontaxt/pull/11)).
  - **FIFO/이동평균 토글 폐기 결정**: 현행 시행령 §88①이 거주자에게 **총평균법 단일**을 강제하므로 사용자 선택권 모델 자체가 법령과 충돌. 자세한 근거·변경 범위는 [docs/tax-law-compliance.md](docs/tax-law-compliance.md) v1.0 참조.
  - **세율 표기 22% 단일 → 20%/2% 분리**: 법문(소득세법 §64의3②)은 세율 20%만 명시. 지방세 2%는 별도 신고·납부 대상. UI/리포트 9군데 일관 정리.
- **2026-05-15** — 초안 작성. 5개 batch 리팩터링 직후 정리.
  - AI 티 6대 시그니처 제거 (atmosphere blob, pointer spotlight, gradient text, heavy glass, notebook grid, rainbow palette)
  - Hero 단문 헤드라인 도입
  - Trust Strip · Security 섹션 신설
  - Footer 4컬럼화
