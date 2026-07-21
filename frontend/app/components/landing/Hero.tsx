"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import Button from "@/app/components/ui/Button";
import Heading from "@/app/components/ui/Heading";
import Grid from "@/app/components/ui/Grid";
import { EASE, STAGGER } from "@/app/lib/motion-tokens";
import { useParallax } from "@/app/hooks/useParallax";
import { cn } from "@/app/lib/utils";
import { RIBBON_SPECTRUM } from "@/app/lib/design-tokens.PATCH";

// Local, token-driven variants â€” no dependency on the legacy lib/motion.ts
// (see Phase 1 audit: Card.tsx got the same treatment).
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE.soft } },
};

const wordContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER.normal, delayChildren: 0.1 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE.soft },
  },
};

// Two words carry the ribbon's spectrum as a gradient fill — same "some
// words are plain, some are colored" pattern as the ToTheNew reference
// headline. Everything else in the headline stays the normal on-dark
// white, same as before.
const HEADLINE_WORDS: { text: string; gradient?: [string, string] }[] = [
  { text: "Every" },
  { text: "guest", gradient: [RIBBON_SPECTRUM.magenta, RIBBON_SPECTRUM.purple] },
  { text: "finds" },
  { text: "their" },
  { text: "own" },
  { text: "memories.", gradient: [RIBBON_SPECTRUM.blue, RIBBON_SPECTRUM.teal] },
];

const STATS = [
  { value: "2M+", label: "Photos matched" },
  { value: "15K+", label: "Events powered" },
  { value: "99.2%", label: "Match accuracy" },
];

// Floating labels scattered around the ribbon, one per spectrum color —
// this is what turns InfinityRibbon from "abstract decoration" into a
// constellation the way ToTheNew's chip layout does. Product-true labels,
// not generic marketing words. xl-only: there's no safe empty space for
// these at narrower widths without colliding with the headline or the
// glass panel column.
const CONSTELLATION_CHIPS: {
  label: string;
  color: string;
  className: string;
}[] = [
  // { label: "Face Match", color: RIBBON_SPECTRUM.magenta, className: "top-[18%] left-[22%] -rotate-12 -translate-x-6 translate-y-2" },
  // { label: "Live Sync", color: RIBBON_SPECTRUM.teal, className: "top-[14%] right-[18%] rotate-8 translate-y-3" },
  // { label: "Instant Search", color: RIBBON_SPECTRUM.blue, className: "bottom-[26%] left-[-1%] -rotate-8 -translate-x-4", },
  // { label: "Private by Default", color: RIBBON_SPECTRUM.purple, className: "bottom-[12%] right-[3%] rotate-10 translate-y-2", },
];

const HEADER_HEIGHT = "clamp(56px, 9vw, 68px)";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  // GSAP-driven parallax on the glass panel as the user scrolls PAST the
  // Hero into the next scene â€” this is the legitimately scroll-driven
  // piece; everything else in this component is Framer (mount-time reveal
  // + cursor interaction), per the GSAP/Framer division rule.
  const parallaxRef = useParallax({ speed: 0.12 });

  // Cursor-follow tilt on the glass panel â€” a local, single-use micro
  // interaction (not promoted to a shared hook/primitive yet; Card.tsx
  // will get this treatment in a later phase if more scenes need it).
  const tiltRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState("perspective(900px) rotateY(0) rotateX(0)");

  function handlePanelMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tiltRef.current) return;
    const rect = tiltRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setTilt(`perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`);
  }

  function handlePanelMouseLeave() {
    setTilt("perspective(900px) rotateY(0) rotateX(0)");
  }

  return (
    <section
      ref={heroRef}
      className="relative w-full flex items-center overflow-hidden pt-14"
    >
      <Grid className="w-full items-center" style={{ paddingTop: HEADER_HEIGHT }}>
        {/* Text content */}
        <Grid.Item span={12} start={1} className="col-span-12 flex flex-col items-center text-center justify-center">
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[var(--color-text-on-dark-muted)] mb-4 sm:mb-6"
          >
            AI-Powered Event Galleries
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={wordContainer}>
            <Heading level="h1" as="h1" className="max-w-2xl">
              {HEADLINE_WORDS.map((w, i) => (
                <motion.span
                  key={i}
                  variants={word}
                  className="inline-block mr-[0.28em]"
                  style={
                    w.gradient
                      ? {
                          backgroundImage: `linear-gradient(90deg, ${w.gradient[0]}, ${w.gradient[1]})`,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }
                      : undefined
                  }
                >
                  {w.text}
                </motion.span>
              ))}
            </Heading>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.3 }}
            className="hidden sm:block mt-6 text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-md text-[clamp(0.95rem,1.4vw,1.125rem)]"
          >
            Scan a QR, take a selfie â€” get every photo you're in, instantly.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.42 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Create your event
              </Button>
            </Link>
            <Link href="/how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.54 }}
            className="mt-10 sm:mt-14 flex items-center gap-8 sm:gap-10"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-xl sm:text-2xl font-semibold text-[var(--color-text-on-dark)]">
                  {stat.value}
                </div>
                <p className="text-xs text-[var(--color-text-on-dark-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </Grid.Item>

        {/* Glass panel â€” the product's own visual language (scan motif),
            not marketing photography. Hidden on small phones to keep the
            fold focused on the headline + CTA (product-before-marketing). */}
        {/* <Grid.Item span={12} start={1} className="hidden lg:block lg:col-span-5 lg:col-start-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE.emerge }}
            ref={mergeRefs(parallaxRef, tiltRef)}
            onMouseMove={handlePanelMouseMove}
            onMouseLeave={handlePanelMouseLeave}
            style={{ transform: tilt, transition: "transform 0.2s ease" }}
          >
            <GlassPanel scanning className="aspect-[3/4] w-full max-w-sm mx-auto p-6 flex flex-col justify-end">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-on-dark-muted)]">
                Live match
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-on-dark)]">
                Scanning event galleryâ€¦
              </p>
            </GlassPanel>
          </motion.div>
        </Grid.Item> */}
      </Grid>

      {/* Constellation chips â€” scattered around InfinityRibbon, xl-only.
          Each chip's border/glow color is one stop from the same
          RIBBON_SPECTRUM the ribbon and headline gradient use, so the
          three elements (ribbon, headline, chips) read as one designed
          system rather than three separate decorations. */}
      {CONSTELLATION_CHIPS.map((chip, i) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 + i * 0.1, ease: EASE.emerge }}
          className={cn("hidden xl:block absolute z-content pointer-events-none", chip.className)}
        >
          <span
            className="inline-flex items-center rounded-[var(--radius-pill)] border px-4 py-2 text-xs font-medium backdrop-blur-sm"
            style={{
              borderColor: `${chip.color}66`,
              color: chip.color,
              background: `${chip.color}14`,
              boxShadow: `0 0 20px 1px ${chip.color}33`,
            }}
          >
            {chip.label}
          </span>
        </motion.div>
      ))}

      {/* Scroll cue â€” desktop only */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "hidden sm:flex absolute bottom-16 left-1/2 -translate-x-1/2 z-content",
          "w-6 h-10 rounded-full border border-[var(--color-hairline-dark)] items-start justify-center p-2"
        )}
      >
        <span className="w-1 h-1.5 rounded-full bg-[var(--color-text-on-dark-muted)]" />
      </motion.div>
    </section>
  );
}
