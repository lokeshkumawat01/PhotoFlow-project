"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/app/lib/motion";

const stats = [
  { value: 2, suffix: "M+", label: "Photos matched" },
  { value: 15, suffix: "K+", label: "Events powered" },
  { value: 99.2, suffix: "%", label: "Match accuracy" },
  { value: 4, suffix: "s", label: "Avg. match time" },
];

function CountUp({
  value,
  suffix,
}: {
  value: number;
  suffix: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: "-80px",
  });

  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 1400;
    const start = performance.now();
    const isDecimal = value % 1 !== 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;

      setDisplay(
        isDecimal
          ? Math.round(current * 10) / 10
          : Math.round(current)
      );

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="bg-[var(--color-bg)] py-20 sm:py-28">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="container-page grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-10"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="flex flex-col items-center text-center"
          >
            <div className="font-heading text-4xl sm:text-5xl font-semibold text-[var(--color-ink)]">
              <CountUp
                value={stat.value}
                suffix={stat.suffix}
              />
            </div>

            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}