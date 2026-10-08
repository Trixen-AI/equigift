import { Nav } from '@/components/sections/Nav';
import { Hero } from '@/components/sections/Hero';
import { Intro } from '@/components/sections/Intro';
import { LiveGlobe } from '@/components/sections/LiveGlobe';
import { Statement } from '@/components/sections/Statement';
import { Pools } from '@/components/sections/Pools';
import { Occasions } from '@/components/sections/Occasions';
import { Guides } from '@/components/sections/Guides';
import { Pricing } from '@/components/sections/Pricing';
import { Cta } from '@/components/sections/Cta';
import { Faq } from '@/components/sections/Faq';
import { Footer } from '@/components/sections/Footer';
import { HOW, SAFE } from '@/data/site';

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <main>
        <Intro />
        <LiveGlobe />
        <Statement id="how" {...HOW} />
        <Pools />
        <Occasions />
        <Guides />
        <Pricing />
        <Statement id="safe" {...SAFE} />
        <Cta />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
