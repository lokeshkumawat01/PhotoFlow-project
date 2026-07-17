"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/app/lib/motion";
import Button from "@/app/components/ui/Button";

export default function Cta() {
  return (
    <section className="relative py-24 md:py-32 text-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--color-gold)]/15 blur-3xl pointer-events-none"
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        className="relative container-page"
      >
        <h2 className="font-heading text-3xl md:text-5xl font-semibold text-[var(--color-ink)] max-w-2xl mx-auto">
          Your next event deserves this
        </h2>
        <p className="mt-4 text-[var(--color-muted)]">
          Set it up in minutes. Your guests will only need a selfie.
        </p>
        <div className="mt-10">
          <Link href="/signup">
            <Button size="lg">Create an event</Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}