"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Button from "@/app/components/ui/Button";
import { blurReveal, fadeUp } from "@/app/lib/motion";

export default function Hero() {
  return (
    <section className="relative h-[100dvh] min-h-[560px] sm:min-h-[720px] w-full overflow-hidden">
      {/* Cinematic background */}
      <Image
        src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2400&auto=format&fit=crop"
        alt="Guests celebrating at a golden-hour wedding reception"
        fill
        priority
        className="object-cover object-[65%_center] sm:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25 sm:from-black/70 sm:via-black/30 sm:to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Content sits BELOW the fixed header (pt-20) and is vertically
          centered in the remaining space — never overflows the screen. */}
      <div className="container-page relative z-10 h-full flex flex-col items-start justify-center pt-20 sm:pt-0 pb-8 sm:pb-0">
        <motion.span
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="hidden xs:block text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white/70 mb-2.5 sm:mb-5"
        >
          AI-Powered Event Galleries
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={blurReveal}
          className="font-heading font-semibold text-white leading-[1.1] sm:leading-[1.05] max-w-3xl text-[clamp(1.9rem,7vw,4.5rem)]"
        >
          Every guest finds
          <br />
          their own memories.
        </motion.h1>

        {/* Shorter copy on phones, full copy from sm and up */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.15 }}
          className="sm:hidden mt-3 text-white/80 max-w-md leading-relaxed text-sm"
        >
          Scan a QR, take a selfie — get every photo you're in, instantly.
        </motion.p>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.15 }}
          className="hidden sm:block mt-6 text-white/80 max-w-xl leading-relaxed text-[clamp(0.95rem,2.2vw,1.125rem)]"
        >
          Scan a QR, take a selfie, and instantly get every photo you appear
          in — from thousands, in seconds. No searching. No folders.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.3 }}
          className="mt-5 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 w-full sm:w-auto"
        >
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Create your event
            </Button>
          </Link>
          <Link href="/how-it-works" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto !bg-white/10 !text-white !border-white/25 backdrop-blur-md hover:!border-white/50"
            >
              See how it works
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll cue — desktop only, never competes with mobile content */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-6 h-10 rounded-full border border-white/40 items-start justify-center p-2"
      >
        <span className="w-1 h-1.5 rounded-full bg-white/80" />
      </motion.div>
    </section>
  );
}