import { Hero } from '@/components/sections/hero';
import { TrustStrip } from '@/components/sections/trust-strip';
import { Problem } from '@/components/sections/problem';
import { ValueAnchor } from '@/components/sections/value-anchor';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Example } from '@/components/sections/example';
import { Exchanges } from '@/components/sections/exchanges';
import { Features } from '@/components/sections/features';
import { Security } from '@/components/sections/security';
import { Pricing } from '@/components/sections/pricing';
import { Roadmap } from '@/components/sections/roadmap';
import { CTA } from '@/components/sections/cta';

// Hero·CTA의 D-day가 Date.now()를 호출하므로 페이지가 dynamic이 됨.
// ISR로 1시간마다 재생성하여 D-day가 자연스럽게 갱신되게 함.
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Problem />
      <ValueAnchor />
      <HowItWorks />
      <Example />
      <Exchanges />
      <Features />
      <Security />
      <Pricing />
      <Roadmap />
      <CTA />
    </>
  );
}
