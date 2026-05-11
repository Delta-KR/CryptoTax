import { Hero } from '@/components/sections/hero';
import { Problem } from '@/components/sections/problem';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Example } from '@/components/sections/example';
import { Exchanges } from '@/components/sections/exchanges';
import { Features } from '@/components/sections/features';
import { Pricing } from '@/components/sections/pricing';
import { CTA } from '@/components/sections/cta';

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Example />
      <Exchanges />
      <Features />
      <Pricing />
      <CTA />
    </>
  );
}
