"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem, viewportOnce } from "@/app/lib/motion";
import Card from "@/app/components/ui/Card";

const POINTS = [
  {
    title: "Your face never leaves a number",
    text: "We never store your selfie. Only a mathematical signature is kept, and it can't be turned back into a picture.",
    icon: <ShieldIcon />,
  },
  {
    title: "Light to browse, full quality on request",
    text: "Galleries load fast because previews are small. The original, full-resolution photo downloads only when you ask for it.",
    icon: <BoltIcon />,
  },
  {
    title: "Built for any event",
    text: "Weddings, birthdays, conferences, school functions — if a camera was there, PhotoFlow can sort the photos by face.",
    icon: <CameraIcon />,
  },
];

export default function WhyDifferent() {
  return (
    <section id="why" className="bg-[var(--color-bg-secondary)] py-24 sm:py-32">
      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs font-semibold text-[var(--color-gold-dark)] uppercase tracking-[0.2em]">
            Why PhotoFlow
          </span>
          <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-semibold text-[var(--color-ink)]">
            Privacy isn&apos;t the price of convenience
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 sm:gap-8"
        >
          {POINTS.map((point) => (
            <motion.div key={point.title} variants={staggerItem}>
              <Card hoverLift glass={false} className="h-full">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-gold)]/10 flex items-center justify-center mb-4 text-[var(--color-gold-dark)]">
                  {point.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
                  {point.title}
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {point.text}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}