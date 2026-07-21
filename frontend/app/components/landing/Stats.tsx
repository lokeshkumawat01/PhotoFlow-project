"use client";

import { motion, type Variants } from "framer-motion";
import { EASE, STAGGER } from "@/app/lib/motion-tokens";
import Heading from "@/app/components/ui/Heading";
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

export default function Stats() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-page">
        <Heading level="h2" eyebrow="By the numbers" className="mb-14 max-w-lg">
          Every scan, every match, at scale.
        </Heading>
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