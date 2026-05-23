# Handoff: Kontaxt — Marketing Landing Page

## Overview
A marketing landing page for **Kontaxt**, a Korean crypto-tax reconciliation platform. The page introduces the 2027 Korean crypto capital-gains tax, explains how the product unifies trade data across exchanges (Upbit / Bithumb / Binance and more), walks through how the calculation works, and converts visitors to free signup.

Sections (in order):
1. **Nav** (sticky) — logo, anchor links (작동 방식 / 지원 거래소 / 기능 / 요금제), theme toggle, login, 무료 시작 CTA
2. **Hero** — D-237 badge, gradient headline, dual CTAs, trust checks, dashboard mock with two floating cards
3. **Problem** — CSV/PDF/XLS format comparison across 3 exchanges + a reconciliation diagram
4. **HowItWorks** — 3 numbered step cards with connecting arrows
5. **Example** — 총평균법 단일 시연 (시행령 §88①), gain/loss list, derived 납부세액 card
6. **Exchanges** — supported exchange grid (Live vs Coming Soon)
7. **Features** — bento-style grid: 1 big card + 4 small cards
8. **Pricing** — 3 tiers (무료 / 프리미엄 / 원타임), monthly↔annual toggle, BEST VALUE emphasis
9. **CTA** — glass card on vivid blob glow + stats strip
10. **Footer** — 4-column layout

A floating **Tweaks** panel exists in the design preview only — it's an authoring tool, not a production feature. Do not ship it.

---

## About the Design Files
The files inside `design/` are **design references created as a static HTML prototype** — they exist to communicate intended look, layout, and behavior. They are *not* production code to ship verbatim.

The expected work is to **recreate this design in the target codebase's existing environment**:
- If there's already a React / Next.js / Vue / SvelteKit / SwiftUI app — use that stack, that component library, that token system, that routing.
- If there's no codebase yet — pick the most appropriate framework for the project (Next.js + Tailwind is a reasonable default for a Korean marketing site that needs server-rendered SEO and Pretendard font loading) and implement there.

The HTML prototype uses React + Babel-in-the-browser only because that was the fastest way to design it. Translate the JSX/CSS-in-JS into idiomatic components in the target stack.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, shadows, gradients, and interactive states are all final. Reproduce pixel-for-pixel using the codebase's existing primitives where they exist; introduce new tokens only when no equivalent exists.

---

## Design Tokens

All tokens are defined in `design/index.html` inside `:root` and `[data-theme="dark"]`. Drop them into the target codebase's token system (Tailwind config, CSS variables, design-system theme file — whatever's idiomatic).

### Colors — Light

| Token | Value | Use |
|---|---|---|
| `--brand` | `#2563EB` | Primary actions, brand accents |
| `--brand-2` | `#1D4ED8` | Brand hover / pressed |
| `--brand-soft` | `#EEF4FF` | Chip / pill backgrounds |
| `--brand-faint` | `#F5F8FF` | Subtle brand-tinted surfaces |
| `--ink` | `#0B1220` | Primary text |
| `--ink-2` | `#1F2937` | Secondary text |
| `--muted` | `#5C6678` | Tertiary text / labels |
| `--muted-2` | `#8A93A4` | Quaternary text |
| `--line` | `#E6EAF0` | Borders |
| `--line-2` | `#EEF1F6` | Inner / subtle dividers |
| `--bg` | `#FFFFFF` | Page background |
| `--bg-soft` | `#FAFBFD` | Section / footer alt background |
| `--bg-tint` | `#F4F7FB` | Inset / track backgrounds |
| `--card` | `#FFFFFF` | Card surface |
| `--card-2` | `#F8FAFC` | Card alt surface |
| `--good` | `#16A34A` | Profit / success |
| `--good-soft` | `#ECFDF5` | Success backgrounds |
| `--bad` | `#DC2626` | Loss / error |
| `--bad-soft` | `#FEF2F2` | Error backgrounds |
| `--warn` | `#D97706` | Warning |
| `--warn-soft` | `#FFFBEB` | Warning backgrounds |

### Colors — Dark (override under `[data-theme="dark"]`)

| Token | Value |
|---|---|
| `--brand` | `#3B82F6` |
| `--brand-2` | `#2563EB` |
| `--brand-soft` | `#1E2A4A` |
| `--brand-faint` | `#182238` |
| `--ink` | `#F1F5F9` |
| `--ink-2` | `#E2E8F0` |
| `--muted` | `#94A3B8` |
| `--muted-2` | `#64748B` |
| `--line` | `#1E293B` |
| `--line-2` | `#1B2433` |
| `--bg` | `#0B1220` |
| `--bg-soft` | `#0E1626` |
| `--bg-tint` | `#111A2C` |
| `--card` | `#131C2E` |
| `--card-2` | `#182238` |
| `--good` | `#22C55E` |
| `--bad` | `#F87171` |
| `--warn` | `#FBBF24` |

### Accent colors (used in section / feature cards, NOT theme-aware)

| Purpose | Hex |
|---|---|
| Step 1 / Big feature / Brand | `#2563EB` |
| Step 2 / Compare feature | `#7C3AED` |
| Step 3 / Globe feature | `#16A34A` |
| Doc feature / Bithumb | `#D97706` / `#F37321` |
| Globe alt | `#0891B2` |
| Upbit | `#0E48F0` |
| Binance | `#F0B90B` (with `#1E2329` ink) |

### Coin chart palette (Example section)
- BTC `#F7931A` · ETH `#627EEA` · SOL `#9945FF`

### Radii
`--r-sm: 8px` · `--r-md: 12px` · `--r-lg: 16px` · `--r-xl: 24px`
Also used directly: 10, 14, 18, 28.

### Shadows
Light:
- `--shadow-sm`: `0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)`
- `--shadow-md`: `0 1px 0 rgba(255,255,255,.8) inset, 0 6px 20px -6px rgba(15,23,42,.10), 0 0 0 1px rgba(15,23,42,.05)`
- `--shadow-lg`: `0 1px 0 rgba(255,255,255,.9) inset, 0 28px 56px -16px rgba(15,23,42,.18), 0 0 0 1px rgba(15,23,42,.04)`

Dark equivalents are in `index.html`; they layer an inset white highlight + an outer brand-tinted glow on `--shadow-lg`.

### Typography

- **Body**: `Pretendard` (loaded from `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9`) → fallback `-apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace / numerics**: `JetBrains Mono` (Google Fonts, weights 400/500/600) → fallback `ui-monospace, monospace`
- **Font features**: body sets `font-feature-settings: "ss06" 1, "ss03" 1`; numeric usage sets `font-variant-numeric: tabular-nums` (`.num` class) and `"tnum" 1` on `.mono`.
- **Wrapping**: `word-break: keep-all; overflow-wrap: break-word` on `html, body` — important for Korean. Many short labels (prices, chip text) force `white-space: nowrap` to prevent syllable-by-syllable wrapping.

Type scale (used sizes, px):
- Hero headline: 56 / 800 / 1.12 / −0.035em
- CTA headline: 56 / 800
- Section title (h2): 44 / 800 / 1.15 / −0.03em
- Card title (h3): 20–24 / 700 / −0.02em
- Stat large: 32–40 / 800 / −0.025em
- Body lead: 17–18 / 1.6
- Body: 13–14
- Eyebrow: 12 / 700 / 0.18em tracking
- Pricing price: 40 / 800
- Tax-result figure: 36 / 800

### Spacing
Sections are vertically padded `120px 32px` (hero is `88px 32px 96px`). Max content width: `1240px`. Grid gaps: 12 / 16 / 24 / 32 / 40 / 56. Card padding: 24 / 28 / 32.

---

## Atmosphere & background system

The page has a continuous "aurora" background that runs the full document — do not lose this when porting; it's the most distinctive part of the visual identity.

Layers (back-to-front):
1. **`body::before` + `body::after`** — fixed-position radial blooms (top-right brand, bottom-left violet `#8B5CF6`), `filter: blur(80–90px)`.
2. **`.atmosphere` container** (absolutely-positioned, behind `#root`):
   - `::before` — fine dot grid `radial-gradient(circle at center, color-mix(in srgb, var(--ink) 10%, transparent) 1px, transparent 1.5px)` at `24px 24px`, masked to fade at top/bottom.
   - `::after` — diagonal hairline streaks via `repeating-linear-gradient(118deg, …)`.
   - **10 `.blob` spans** (`b1`–`b10`) positioned down the page, each `border-radius: 50%`, `filter: blur(120px)` (light) / `140px` (dark), `opacity: 0.7` (light) / `0.85` (dark). Color rotation: brand blue → violet `#8B5CF6` → cyan `#06B6D4`.
3. **`#root` background** — a vertical linear-gradient knitting `--bg` → `--bg-soft` blends through the whole document so transparent sections share one color story.

The Hero adds a **notebook grid** overlay (40px × 40px brand-tinted lines, masked by a radial ellipse). The CTA adds the same grid masked by a vertical linear fade plus 3 additional vivid blobs.

Hover-tracked spotlight: a JS `pointermove` listener writes `--mx` / `--my` CSS vars on the `.hov` element under the cursor. `.hov::before` draws a 220px radial spotlight at those vars; `.hov::after` adds a brand-tinted inner border. On `:hover` the card lifts `translateY(-3px)` and the spotlight + brand glow fade in.

---

## Section-by-section

### 1. Nav (`parts/chrome.jsx` → `Nav`)
Sticky top, `border-bottom: 1px solid var(--line)`, `backdrop-filter: blur(20px) saturate(180%)` over `color-mix(in srgb, var(--bg) 85%, transparent)`. Layout: brand wordmark left, anchor links centered, theme toggle + 로그인 + 무료 시작 right. Anchors target `#how`, `#exchanges`, `#features`, `#pricing`. Theme toggle persists to `localStorage` under key `kontaxt-theme`; the value is restored by an inline `<script>` in the document head before React mounts (prevents flash).

### 2. Hero (`parts/hero.jsx`)
2-column grid (`1fr 1.05fr`, gap 56). Left:
- Pill badge: blue dot icon + "2027년 1월 1일 과세 시행 확정 · D-237"
- Headline 56px/800, last clause has a gradient fill: `linear-gradient(120deg, var(--brand) 0%, #6366F1 60%, #8B5CF6 100%)` clipped to text
- Lead paragraph
- Two buttons (primary brand-filled with arrow icon; secondary card-bordered with file icon)
- Three check chips: 신용카드 불필요 / 1거래소 영구 무료 / 2분만에 첫 결과

Right: **DashboardMock** — a glass-effect "app window" with macOS traffic-light chrome and:
- Header: "2027년 귀속 · 가상자산 양도소득" / "세금 계산 결과" + green ● 계산 완료 pill
- 3 stat tiles (총 양도차익 / 기본공제 / 납부세액) — the 납부세액 tile uses `--brand-faint` background and brand-tinted border
- Horizontal bar chart: BTC / ETH / SOL / XRP, each a 36px label + bar + amount, with gradient fills (`#60A5FA → var(--brand)` for gains, `#FCA5A5 → var(--bad)` for losses)
- 4 chips below: 총평균법 / 의제취득가액 적용 / 3개 거래소 통합 / 247건 거래
- Two **floating cards** absolutely positioned above + below-right of the mock: "업비트 거래내역 · upbit_2027.pdf · 통합 완료" with green check, and "2027 신고용 PDF · tax_report_홍길동.pdf · 세무사 전달 가능" with green dot.

### 3. Problem (`parts/problem.jsx`)
Section eyebrow + 2-line title (second line in `--muted`) + lead.
3-column grid of **CSVCard**s — one per exchange (업비트/PDF, 빗썸/XLS, 바이낸스/CSV). Each card:
- Colored header bar in exchange brand color (`#0E48F0` / `#F37321` / `#F0B90B`) with white logo square + name + monospace `.pdf`/`.xls`/`.csv` chip
- Monospace comment line `# BTC 0.005 매수 · 425,212원`
- Two-column table of label/value rows in JetBrains Mono with `font-variant-numeric: tabular-nums`
- Quirks footer in `--bg-soft` with bordered pill chips (PDF 전용, 슬래시 날짜, UTC 시간, etc.)
- Hover highlight via `.hov`; first-card-hover (or `active` state) thickens the border in the exchange color and adds a `0 0 0 4px ${color}15` glow

Below the cards, a **reconciliation diagram**: 5-column grid (pills → arrow → label → arrow → "3초" result). Pills are red-tinted (`tone="bad"`) to convey friction; result is green.

### 4. HowItWorks (`parts/howitworks.jsx`)
Centered title, 3 step cards separated by SVG arrows in a single grid row (`1fr auto 1fr auto 1fr`). Each card has:
- Huge step numeral (`0n` / 64px / 800 / accent color at 0.7 opacity) absolutely positioned top-right
- Mono `STEP 0n` pill in a soft accent background
- 48px rounded icon tile in soft accent background
- Title 20/700 + description 14/muted

Step accent colors: `#2563EB` / `#7C3AED` / `#16A34A`.

### 5. Example (`parts/example.jsx`)
Two-column glass grid (`1.2fr 1fr`):
- **Left card** — title row "총평균법 기준 (시행령 §88①)" with a `거주자 법정` badge. List of 3 trades (BTC +1500만, ETH −300만, SOL +300만). Each row: round colored coin badge in `${coinColor}18` background + name + mono buy/sell text + signed amount in good/bad color.
- **Right card** — calculation flow with `CalcRow`s: 총 양도차익 → 기본공제 (−250만원) → divider → 과세표준 (bold) → × 세율 (20%, 지방세 2% 별도) → thick divider → final 납부세액 result in a brand-filled card with `36px / 800` figure and brand-glow shadow.

거주자 가상자산 양도소득은 시행령 §88①·§92②4호에 따라 총평균법 단일 적용 — FIFO/이동평균 사용자 토글 모델은 폐기됨 (P1 PR #12).

### 6. Exchanges (`parts/exchanges.jsx`)
Two groups:
- **LIVE** — green pill header, 3-column grid of cards (max-width 800px). Each card: 48px logo tile in soft brand-tinted bg + name + EN sub + green check circle.
- **COMING SOON** — amber pill header, 4-column grid of `border: 1px dashed var(--line)` cards. Each: 40px logo tile + name.

Logos pulled from favicon URLs (Upbit / Bithumb / Binance / Bybit / OKX / Bitget / Coinone). All have `onError` fallbacks that hide the broken image. In production, replace with bundled SVG logos.

### 7. Features (`parts/features.jsx`)
Bento grid: `1.4fr 1fr 1fr` × 2 rows. The big card spans both rows on the left; 4 small cards fill the right 2×2.

- **Big (FeatureBig)** — 다중 거래소 데이터 통합. Subtle brand-tinted gradient bg, 48px icon tile, title 22/700, description, plus a "247건" visual: three left-bordered tiles (`#0E48F0` / `#F37321` / `#F0B90B`) showing per-exchange counts.
- **Small (FeatureCard ×4)** — 계산 방식 선택, 의제취득가액 자동 적용, 해외 거래 환율 변환, 세무사 전달용 PDF. Each: 40px icon tile in `color-mix(in srgb, ${color} 12%, var(--card))`, title 16/700, body 13/muted.

Icons are inline SVGs (`compare` / `shield` / `globe` / `doc`) defined in `FeatureIcon`.

### 8. Pricing (`components/sections/pricing.tsx`)
Title + 3-card grid (no monthly/annual toggle — 월 결제 없음). 3 cards in order:
- **무료** — ₩0 · 4 features (결제 전 결과 미리보기 funnel)
- **구독 (premium)** — emphasized: `bg-card shadow-sm ring-1 ring-brand/10` (brand ring, **no dark gradient · no BEST VALUE pill — DESIGN.md §8 안티패턴 회피**). Brand pill `2026.Q4 출시 예정` absolutely-positioned at top-center. CTA `출시 알림 받기` (premium 은 MVP 미판매 — Phase 2: 2026.Q4 이후).
- **원타임** — ₩49,900 · 단일 과세연도 1회 결제 (확정 전략 2026-05-21).

Annual subscription ₩89,000/년 (연중 절세 도구 — Phase 2 출시 예정). 단일 source: `lib/pricing/plans.ts` (가격·features 모두 여기서 가져다 씀). Each card: tag eyebrow, name 24/800, price row (40/800 figure + sub in muted), divider, feature list with brand-tinted checks, full-width CTA button.

### 9. CTA (`components/sections/cta.tsx`)
Solid card on neutral background (**no blobs · no gradients · no violet — DESIGN.md §8 안티패턴 회피**). Card padding 넉넉 (section-pad), `border-radius: 28px`. Contents:
- Brand pill: "첫 신고까지 D-{N}" (동적 계산, 차분한 톤 — DESIGN.md §4)
- Headline 56/800 with **solid brand blue** text (그라디언트·보라 X). 단문 한 문장 + 마침표.
- Lead, two buttons (primary brand + ghost), and a **stats strip**: 1,150~1,250만 한국 가상자산 보유자 (2026 추정, 금융위 실태조사 연율화) / 22% 양도소득세율 (소득세 20% + 지방세 2%) / 250만원 기본공제 — middle stat has vertical dividers.

### 10. Footer (`parts/chrome.jsx` → `Footer`)
`--bg-soft` background, 4-column grid (`1.4fr 1fr 1fr 1fr`):
- Brand + description
- 서비스 column
- 회사 column
- 고객지원 column

Bottom bar: copyright left, disclaimer right ("본 서비스는 세무 신고의 참고 자료를 제공하며, 최종 신고는 세무사 검토를 권장합니다.").

---

## Interactions & Behavior

- **Theme toggle** — Light / Dark via `data-theme` attribute on `<html>`. Persisted in `localStorage["kontaxt-theme"]`. **Implement an inline script that reads the saved value before first paint** to avoid theme flash.
- **`.hov` hover** — pointer-tracked spotlight + lift on cards (CSV cards, step cards, exchange cards, feature cards, pricing cards). Transition `transform .35s cubic-bezier(.2,.7,.2,1)`.
- **CSV card highlight** — `onMouseEnter` sets an active exchange in `Problem`; the active card gets a colored border + soft glow.
- **Pricing monthly/annual toggle** — flips price and sub-label, shows saving line on annual.
- **Anchor nav** — smooth scroll to `#how`, `#exchanges`, `#features`, `#pricing`. (Use `scroll-behavior: smooth` on `html` or per-link.)
- **Responsive** — not implemented in the mock. Production must collapse all `repeat(3, 1fr)` and 2-column hero grids to single-column below ~960px, with reduced section padding (`80px 24px`) on tablet and `64px 20px` on mobile. The dashboard mock should hide its floating cards or restack on narrow widths.

---

## State Management

Local component state only:
- `App` → `useTweaks` (authoring-only, **do not ship**)
- `Problem` → `active` (string: 'upbit' / 'bithumb' / 'binance')
- `Pricing` → `annual` (boolean)
- `chrome.Nav.ThemeToggle` → `dark` (boolean, persisted)

No data fetching. Exchange logos use `window.__resources` if present, otherwise fall back to live favicon URLs — replace both with bundled assets in production.

---

## Production Checklist

1. **Strip the Tweaks system** — `app.jsx` imports `tweaks-panel.jsx` and renders `<TweaksPanel>`. Remove the import, the `useTweaks` hook, the panel render, and the `TWEAK_DEFAULTS` block. Hard-code the resulting tokens (primary `#2563EB`, gradient headline).
2. **Replace favicon URLs with bundled SVG logos** for Upbit / Bithumb / Binance / Bybit / OKX / Bitget / Coinone. The mock uses `https://www.google.com/s2/favicons?...` and direct favicon URLs — these are unreliable in production and CSP-risky.
3. **Self-host Pretendard** (the prototype loads from a CDN). Use the official `pretendard-dynamic-subset` for KR + Latin or self-host the static build.
4. **Self-host JetBrains Mono** via `next/font` or equivalent.
5. **Implement responsive breakpoints** (see above).
6. **Wire CTAs** — 무료로 시작하기 / 무료 시작 / 신고 시즌 구매 / 프리미엄 시작 all need real signup destinations.
7. **Wire anchor smooth-scroll** + nav highlight-on-scroll if desired.
8. **SEO** — add `<title>`, `<meta description>`, OG tags, structured data. Korean: set `<html lang="ko">` (already done in mock).
9. **Accessibility audit** — buttons need `:focus-visible` styles (mock doesn't define them), the theme toggle already has `aria-label`, the atmosphere layer is correctly `aria-hidden`. Many SVGs need accessible alternatives where they convey meaning vs decoration.
10. **Dark-mode QA** — the design ships full dark-mode tokens but several inline `style` colors (e.g. pricing `linear-gradient(#1E3A8A → #0F1B3D)`, BEST VALUE shadow) are theme-neutral and read well on both — confirm in production.

---

## Files
Everything under `design/` is the working prototype:
- `design/index.html` — root document. Contains all CSS variables, the atmosphere layer, the theme-restore inline script, and `<script>` tags loading every component in order.
- `design/app.jsx` — root `App` component + Tweaks wiring.
- `design/tweaks-panel.jsx` — authoring-only Tweaks UI. **Do not port.**
- `design/parts/hero.jsx` — Hero + DashboardMock + Badge + Check + Stat + Bar + Chip
- `design/parts/problem.jsx` — Problem + CSVCard + Pill + ArrowRight + SectionEyebrow + SectionTitle + SectionLead (the section helpers are reused by other parts)
- `design/parts/howitworks.jsx` — HowItWorks
- `design/parts/example.jsx` — Example + CalcRow + Divider
- `design/parts/exchanges.jsx` — Exchanges
- `design/parts/features.jsx` — Features + FeatureBig + FeatureCard + FeatureIcon
- `design/parts/pricing.jsx` — Pricing + PricingCard
- `design/parts/cta.jsx` — CTA + Stat2
- `design/parts/chrome.jsx` — Nav + ThemeToggle + Logo + Footer + FooterCol

To preview the prototype locally: open `design/index.html` in a browser. (It uses Babel-in-the-browser — there's no build step.)
