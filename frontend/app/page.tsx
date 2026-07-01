"use client";

import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export default function HomePage() {
  return (
    <div className="bg-white">
      <SiteHeader />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <WhyDifferentSection />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="px-6 pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-coral-tint px-4 py-1.5 mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-coral" />
          <p className="text-xs font-semibold text-coral-dark uppercase tracking-wide">
            For weddings, parties &amp; every event in between
          </p>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] text-ink">
          Find every photo{" "}
          <span className="text-coral">you're in</span> — without
          scrolling through thousands of them
        </h1>
        <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
          The photographer uploads the full album. You take a selfie.
          PhotoFlow hands you back only your photos — in seconds.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="focus-ring btn-primary rounded-full px-7 py-3.5 font-semibold">
            Create an event
          </Link>
          <Link href="/how-it-works" className="focus-ring btn-secondary rounded-full px-7 py-3.5 font-semibold">
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "1,800+", label: "Photos sorted per event" },
    { value: "<1s", label: "Average match time" },
    { value: "0", label: "Selfies ever stored" },
    { value: "100%", label: "Events, not just weddings" },
  ];
  return (
    <section className="border-y border-hairline bg-coral-tint">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl md:text-4xl font-bold text-coral">{stat.value}</p>
            <p className="text-sm text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { number: "01", title: "Upload the album", text: "The photographer uploads the full event album in one batch — thousands of photos at once, processed automatically in the background." },
    { number: "02", title: "Faces are mapped, not stored", text: "Every face in every photo becomes a unique signature. No photo of your face is ever saved on its own." },
    { number: "03", title: "Guests take a selfie", text: "Guests scan a QR code, take a live selfie in the browser, and get matched instantly — no app, no account." },
    { number: "04", title: "Only their photos, instantly", text: "Matches return in seconds as fast-loading previews. The full-resolution original is one tap away." },
  ];
  return (
    <section id="how-it-works" className="px-6 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold text-coral uppercase tracking-wide mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-ink">From a full album to a personal gallery, automatically</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="lift-on-hover rounded-2xl border border-hairline p-7">
              <p className="text-sm font-bold text-coral mb-3">{step.number}</p>
              <h3 className="text-xl font-semibold text-ink mb-2">{step.title}</h3>
              <p className="text-muted leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyDifferentSection() {
  const points = [
    { title: "Your face never leaves a number", text: "We never store your selfie. Only a mathematical signature is kept, and it can't be turned back into a picture." },
    { title: "Light to browse, full quality on request", text: "Galleries load fast because previews are small. The original, full-resolution photo downloads only when you ask for it." },
    { title: "Built for any event", text: "Weddings, birthdays, conferences, school functions — if a camera was there, PhotoFlow can sort the photos by face." },
  ];
  return (
    <section id="why" className="px-6 py-24 md:py-32 bg-coral-tint">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold text-coral uppercase tracking-wide mb-3">Why PhotoFlow</p>
          <h2 className="text-3xl md:text-4xl font-bold text-ink">Privacy isn't the price of convenience</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {points.map((point) => (
            <div key={point.title} className="lift-on-hover rounded-2xl bg-white p-7 border border-hairline">
              <h3 className="text-lg font-semibold text-ink mb-3">{point.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="px-6 py-24 md:py-32 text-center">
      <h2 className="text-3xl md:text-5xl font-bold text-ink max-w-2xl mx-auto">Your next event deserves this</h2>
      <p className="mt-4 text-muted">Set it up in minutes. Your guests will only need a selfie.</p>
      <div className="mt-10">
        <Link href="/dashboard" className="focus-ring btn-primary rounded-full px-7 py-3.5 font-semibold inline-block">
          Create an event
        </Link>
      </div>
    </section>
  );
}