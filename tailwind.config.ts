import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — driven by CSS vars in app/globals.css.
        // Vars hold an RGB triplet (e.g. "37 99 235") so Tailwind's
        // `<alpha-value>` placeholder fills in opacity for utilities like
        // `bg-brand/50`. For raw CSS, wrap in rgb(): `rgb(var(--brand))`.
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-2': 'rgb(var(--brand-2) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        'brand-faint': 'rgb(var(--brand-faint) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-2': 'rgb(var(--muted-2) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-2': 'rgb(var(--line-2) / <alpha-value>)',
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-soft': 'rgb(var(--bg-soft) / <alpha-value>)',
        'bg-tint': 'rgb(var(--bg-tint) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-2': 'rgb(var(--card-2) / <alpha-value>)',
        good: 'rgb(var(--good) / <alpha-value>)',
        'good-soft': 'rgb(var(--good-soft) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
        'bad-soft': 'rgb(var(--bad-soft) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        'warn-soft': 'rgb(var(--warn-soft) / <alpha-value>)',

        // Static accent palettes — NOT theme-aware (same in light & dark).
        // Used for step accents, feature card icons, and exchange branding.
        step: {
          1: '#2563EB',
          2: '#7C3AED',
          3: '#16A34A',
        },
        accent: {
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          'globe-alt': '#0891B2',
          doc: '#D97706',
        },
        exchange: {
          upbit: '#0E48F0',
          bithumb: '#F37321',
          binance: '#F0B90B',
          'binance-ink': '#1E2329',
        },
        coin: {
          btc: '#F7931A',
          eth: '#627EEA',
          sol: '#9945FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '28px',
      },
      boxShadow: {
        // Composite layered shadows — CSS-var-backed so dark mode swaps the
        // inset highlight + outer brand glow automatically (see globals.css).
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        // Static brand glow for emphasized cards / primary CTAs
        'brand-glow': '0 16px 40px -8px rgba(37,99,235,.35), 0 0 0 1px rgba(37,99,235,.15)',
      },
      maxWidth: {
        content: '1240px',
      },
      letterSpacing: {
        eyebrow: '0.18em',
        tightish: '-0.02em',
        tighter2: '-0.025em',
        tighter3: '-0.03em',
        tightest: '-0.035em',
      },
      fontSize: {
        // README type scale — [size, { lineHeight, letterSpacing, fontWeight }]
        eyebrow: ['12px', { lineHeight: '1', letterSpacing: '0.18em', fontWeight: '700' }],
        body: ['14px', { lineHeight: '1.55' }],
        'body-lead': ['18px', { lineHeight: '1.6' }],
        'card-title': ['20px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'card-title-lg': ['24px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        'pricing-name': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        'pricing-price': ['40px', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '800' }],
        'tax-figure': ['36px', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '800' }],
        'stat-lg': ['32px', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '800' }],
        'stat-xl': ['40px', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '800' }],
        'section-title': ['44px', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '800' }],
        'hero-headline': ['56px', { lineHeight: '1.12', letterSpacing: '-0.035em', fontWeight: '800' }],
      },
      backgroundImage: {
        // Solid-feel emphasis surface — single brand tone, no rainbow.
        'pricing-emphasized':
          'linear-gradient(180deg, rgb(var(--brand-2)) 0%, rgb(var(--brand)) 100%)',
      },
      transitionTimingFunction: {
        hov: 'cubic-bezier(.2,.7,.2,1)',
      },
    },
  },
  plugins: [],
};

export default config;
