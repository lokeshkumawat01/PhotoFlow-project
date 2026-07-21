"use client";

import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/app/lib/motion";

// Placeholder brand names — swap with real client logos (as <Image> tags)
// once PhotoFlow has verified partners. Keep the array structure the same
// so the marquee logic doesn't need to change.
const trustedNames = [
  "Grand Palace Weddings",
  "Studio Lumière",
  "Eventia",
  "The Ivory Room",
  "Frame & Co.",
  "Golden Hour Studios",
  "Vera Events",
  "Lantern House",
];

// Duplicate the list so the marquee loop is seamless
const marqueeItems = [...trustedNames, ...trustedNames];

export default function Trusted() {
  return (
    <section className="bg-[var(--color-bg)] py-14 sm:py-20 border-y border-[var(--color-hairline)]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        className="container-page"
      >
        <p className="text-center text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[var(--color-muted)] mb-8 sm:mb-10">
          Trusted by event professionals
        </p>
      </motion.div>

      {/* Marquee — full-bleed, outside container-page so it can scroll edge-to-edge */}
      <div className="relative w-full overflow-hidden">
        {/* Fade masks on the edges so items don't pop in/out abruptly */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[var(--color-bg)] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[var(--color-bg)] to-transparent z-10" />

        <motion.div
          className="flex items-center gap-12 sm:gap-20 whitespace-nowrap w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {marqueeItems.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="font-heading text-lg sm:text-2xl font-medium text-[var(--color-ink)]/30 hover:text-[var(--color-gold)] transition-colors duration-300 cursor-default"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}