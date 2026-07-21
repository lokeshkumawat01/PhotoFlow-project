"use client";

import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import HeroChapterScene from "./components/landing/HeroChapterScene";
import Hero from "./components/landing/Hero";
import Stats from "./components/landing/Stats";
import Trusted from "./components/landing/Trusted";
import HowItWorks from "./components/landing/HowItWorks";
import QrExperience from "./components/landing/QrExperience";
import AiSection from "./components/landing/AiSection";
import WhyDifferent from "./components/landing/WhyDifferent";
import Cta from "./components/landing/Cta";

export default function HomePage() {
  return (
    <div>
      <SiteHeader />
      <HeroChapterScene>
        <Hero />
        <Stats />
      </HeroChapterScene>
      <Trusted />
      <HowItWorks />
      <QrExperience />
      <AiSection />
      <WhyDifferent />
      <Cta />
      <SiteFooter />
    </div>
  );
}