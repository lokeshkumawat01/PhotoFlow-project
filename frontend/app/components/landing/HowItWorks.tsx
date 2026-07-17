"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { blurReveal, fadeUp, viewportOnce } from "@/app/lib/motion";
import Badge from "@/app/components/ui/Badge";

const steps = [
  {
    number: "01",
    title: "Scan the QR code",
    description:
      "Every PhotoFlow event comes with a custom-branded QR code, ready to print on welcome boards, table cards, or entrance banners. Guests simply open their phone camera and scan — there's no app to download, no account to create, and no waiting in line. Within seconds they're inside your event's private, secure photo gallery, ready for the next step.",
    image:
      "https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=1600&auto=format&fit=crop",
    badge: "No app needed",
  },
  {
    number: "02",
    title: "Take a quick selfie",
    description:
      "Guests take one selfie directly in the browser, no photo library upload required. Our built-in liveness detection confirms it's a real person in real time, blocking spoofed or stolen images before they ever reach our AI face-matching engine. Every selfie is encrypted, used only for matching, and never shared with other guests or third parties.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1600&auto=format&fit=crop",
    badge: "Privacy-first",
  },
  {
    number: "03",
    title: "AI finds every photo of you",
    description:
      "Our facial recognition engine, built on InsightFace, scans through every photo and video uploaded by the organizer — from the official photographer's shoot to candid guest uploads — and identifies every frame you appear in, even partial angles or background shots. What would take a professional photo studio hours of manual tagging happens for you in a matter of seconds.",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1600&auto=format&fit=crop",
    badge: "AI Matched",
  },
  {
    number: "04",
    title: "Your private gallery, instantly",
    description:
      "A personal gallery appears with only your photos and videos, beautifully organized and ready to browse, favorite, download in full resolution, or share directly to social media. VIP guests unlock extended access including highlight reels and early video downloads. No folders to dig through, no group chats to search — just your memories, delivered to you.",
    image:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1600&auto=format&fit=crop",
    badge: "Ready in seconds",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[var(--color-bg)] py-24 sm:py-32">
      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="max-w-2xl mb-16 sm:mb-24"
        >
          <span className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-dark)]">
            How it works
          </span>
          <h2 className="mt-4 font-heading text-3xl sm:text-5xl font-semibold text-[var(--color-ink)] leading-tight">
            From scan to memory, in under a minute.
          </h2>
          <p className="mt-5 text-[var(--color-muted)] leading-relaxed">
            PhotoFlow is an AI-powered event photo gallery that uses secure
            facial recognition to deliver every guest their own private set
            of photos and videos — automatically, without manual sorting or
            folder-sharing.
          </p>
        </motion.div>

        <div className="flex flex-col gap-20 sm:gap-32">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-10 lg:gap-16`}
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                variants={blurReveal}
                className="relative w-full lg:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden"
              >
                <Image src={step.image} alt={step.title} fill className="object-cover" />
                <div className="absolute top-4 left-4">
                  <Badge variant="ai">{step.badge}</Badge>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                variants={fadeUp}
                className="w-full lg:w-1/2"
              >
                <span className="font-heading text-5xl sm:text-6xl font-semibold text-[var(--color-gold)]/25">
                  {step.number}
                </span>
                <h3 className="mt-3 font-heading text-2xl sm:text-3xl font-semibold text-[var(--color-ink)]">
                  {step.title}
                </h3>
                <p className="mt-4 text-[var(--color-muted)] leading-relaxed max-w-md">
                  {step.description}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}