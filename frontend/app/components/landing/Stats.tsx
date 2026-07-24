"use client";

import { motion, type Variants } from "framer-motion";
import { EASE, STAGGER } from "@/app/lib/motion-tokens";
import { RIBBON_SPECTRUM } from "@/app/lib/design-tokens";
import { cn } from "@/app/lib/utils";
import InfinityRibbon from "./InfinityRibbon";
import StatChip from "@/app/components/ui/StatChip";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER.normal, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE.soft } },
};

const stats = [
  { value: "2M+", label: "Photos matched" },
  { value: "15K+", label: "Events powered" },
  { value: "99.2%", label: "Match accuracy" },
  { value: "4s", label: "Avg. match time" },
];

// Same 6 capabilities that were scaffolded for the Hero, now shown here
// instead — around this section's own dedicated, foreground ribbon.
const CAPABILITY_CHIPS: { label: string; color: string; className: string; floatDelay: string }[] = [
  { label: "AI Face Match", color: RIBBON_SPECTRUM.magenta, className: "top-[8%] left-[10%]", floatDelay: "0s" },
  { label: "Secure & Private", color: RIBBON_SPECTRUM.gold, className: "top-[38%] left-[2%]", floatDelay: "-1.2s" },
  { label: "QR Scan", color: RIBBON_SPECTRUM.green, className: "bottom-[8%] left-[12%]", floatDelay: "-2.4s" },
  { label: "Instant Gallery", color: RIBBON_SPECTRUM.blue, className: "top-[8%] right-[10%]", floatDelay: "-0.6s" },
  { label: "Live Sync", color: RIBBON_SPECTRUM.teal, className: "top-[38%] right-[2%]", floatDelay: "-1.8s" },
  { label: "Video Highlights", color: RIBBON_SPECTRUM.coral, className: "bottom-[8%] right-[12%]", floatDelay: "-3s" },
];

export default function Stats() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Foreground capability ribbon — its own instance, z-content, NOT
          the shared background ribbon from HeroChapterScene. Sits above
          everything else in this section, chips arranged around it. */}
      <div className="relative z-content w-full max-w-3xl mx-auto h-[380px] sm:h-[460px] mb-16 sm:mb-24">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "min(90%, 640px)", opacity: 0.9 }}
        >
          <InfinityRibbon className="w-full h-auto block [&_svg]:w-full [&_svg]:h-auto" />
        </div>

        {CAPABILITY_CHIPS.map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: EASE.emerge }}
            className={cn("hidden md:block absolute", chip.className)}
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
      </div>

      {/* Numeric stats — unchanged, neutral/restrained per our earlier
          decision (no RIBBON_SPECTRUM colors on the numbers themselves,
          so the color-accent stays "special" to the ribbon + chips only). */}
      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-10"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <StatChip value={stat.value} label={stat.label} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}