"use client";

import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import Hero from "./components/landing/Hero";
import Stats from "./components/landing/Stats";
import HowItWorks from "./components/landing/HowItWorks";
import WhyDifferent from "./components/landing/WhyDifferent";
import Cta from "./components/landing/Cta";

export default function HomePage() {
  return (
    <div className="bg-white">
      <SiteHeader />
      <Hero />
      <Stats />
      <HowItWorks />
      <WhyDifferent />
      <Cta />
      <SiteFooter />
    </div>
  );
}