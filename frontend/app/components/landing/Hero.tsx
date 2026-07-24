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
import { RIBBON_SPECTRUM } from "@/app/lib/design-tokens";

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

// Two words carry the ribbon's spectrum, now as a FLOWING gradient (the
// .animated-gradient-text utility already in globals.css) instead of a
// static linear-gradient fill. Each word only needs --grad-from/--grad-to;
// the class's own repeating-linear-gradient + background-position
// animation handles the "water" motion — no per-word animation code needed.
// The two words share "purple" as their inner stop so the two gradients
// read as one continuous palette rather than two unrelated pairs.
const HEADLINE_WORDS: { text: string; gradient?: [string, string] }[] = [
  { text: "Every" },
  { text: "guest", gradient: [RIBBON_SPECTRUM.magenta, RIBBON_SPECTRUM.purple] },
  { text: "finds" },
  { text: "their" },
  { text: "own" },
  { text: "memories.", gradient: [RIBBON_SPECTRUM.purple, RIBBON_SPECTRUM.magenta] },
];

const STATS = [
  { value: "2M+", label: "Photos matched" },
  { value: "15K+", label: "Events powered" },
  { value: "99.2%", label: "Match accuracy" },
];

const CONSTELLATION_CHIPS: {
  label: string;
  color: string;
  className: string;
  floatDelay: string;
}[] = [];

const HEADER_HEIGHT = "clamp(56px, 9vw, 68px)";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const parallaxRef = useParallax({ speed: 0.12 });

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
            {/* max-w-2xl + mx-auto + break-words keeps this readable and
                non-overflowing on narrow phones, where a single long word
                could otherwise force horizontal scroll. */}
            <Heading level="h1" as="h1" className="max-w-2xl mx-auto break-words">
              {HEADLINE_WORDS.map((w, i) => (
                <motion.span
                  key={i}
                  variants={word}
                  className={cn(
                    "inline-block mr-[0.28em]",
                    w.gradient && "animated-gradient-text"
                  )}
                  style={
                    w.gradient
                      ? ({
                          "--grad-from": w.gradient[0],
                          "--grad-to": w.gradient[1],
                          // Slightly shorter words flow a bit faster so the
                          // motion still reads clearly at small sizes â€”
                          // otherwise a short word like "guest" would barely
                          // show any movement over the same 300px period.
                          "--period": `${Math.max(120, w.text.length * 40)}px`,
                        } as React.CSSProperties)
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
            Scan a QR, take a selfie — get every photo you're in, instantly.
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
      </Grid>

      {CONSTELLATION_CHIPS.map((chip, i) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 + i * 0.1, ease: EASE.emerge }}
          className={cn("hidden xl:block absolute z-content", chip.className)}
        >
          <div className="chip-float" style={{ animationDelay: chip.floatDelay }}>
            <span
              className="inline-flex items-center rounded-[var(--radius-pill)] border px-4 py-2 text-xs font-medium backdrop-blur-sm transition-transform duration-300 hover:scale-105"
              style={{
                borderColor: `${chip.color}66`,
                color: chip.color,
                background: `${chip.color}14`,
                boxShadow: `0 0 20px 1px ${chip.color}33`,
              }}
            >
              {chip.label}
            </span>
          </div>
        </motion.div>
      ))}

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