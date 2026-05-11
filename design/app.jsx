const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#2563EB",
  "headline": "gradient",
  "showFloatingCards": true,
  "ctaStyle": "dark"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Live theme override
  React.useEffect(() => {
    document.documentElement.style.setProperty('--brand', t.primaryColor);
    // Derive a darker brand-2
    document.documentElement.style.setProperty('--brand-2', t.primaryColor);
  }, [t.primaryColor]);

  return (
    <div>
      <Nav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Example />
      <Exchanges />
      <Features />
      <Pricing />
      <CTA />
      <Footer />

      <TweaksPanel>
        <TweakSection label="브랜드" />
        <TweakColor
          label="Primary"
          value={t.primaryColor}
          options={['#2563EB', '#0EA5E9', '#7C3AED', '#0F172A']}
          onChange={(v) => setTweak('primaryColor', v)}
        />
        <TweakSection label="히어로" />
        <TweakRadio
          label="제목 스타일"
          value={t.headline}
          options={['gradient', 'solid']}
          onChange={(v) => setTweak('headline', v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
