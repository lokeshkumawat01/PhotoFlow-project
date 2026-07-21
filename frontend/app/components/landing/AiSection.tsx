"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/app/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Approximate face positions on the reference image, as % of width/height.
// Tuned to the specific Unsplash photo below — adjust if the image changes.
const FACES = [
  { x: 32, y: 38, label: "Guest 01" },
  { x: 58, y: 44, label: "Guest 02" },
  { x: 71, y: 30, label: "Guest 03" },
];

const LOCKED_FACE_INDEX = 1; // which face gets the full "match found" sequence

export default function AiSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: imageWrapRef.current,
          start: "top 65%",
          once: true,
        },
      });

      // 1. Mesh dots fade + scale in, staggered — "AI is scanning"
      tl.fromTo(
        dotRefs.current,
        { opacity: 0, scale: 0 },
        { opacity: 0.9, scale: 1, duration: 0.4, stagger: 0.12, ease: "back.out(2)" }
      );

      // 2. Bounding box draws in around the locked face
      tl.fromTo(
        boxRef.current,
        { opacity: 0, scale: 1.15 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
        "+=0.2"
      );

      // 3. Label + confidence score reveal
      tl.fromTo(
        labelRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.1"
      );

      // 4. Count-up the confidence score
      const counter = { value: 0 };
      tl.to(
        counter,
        {
          value: 98.7,
          duration: 1.1,
          ease: "power1.out",
          onUpdate: () => {
            if (scoreRef.current) {
              scoreRef.current.textContent = counter.value.toFixed(1) + "%";
            }
          },
        },
        "-=0.2"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[var(--color-bg-secondary)] py-24 sm:py-32 overflow-hidden">
      <div className="container-page grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Text side */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="order-2 lg:order-1"
        >
          <span className="text-xs font-semibold text-[var(--color-gold-dark)] uppercase tracking-[0.2em]">
            AI-Powered Matching
          </span>
          <h2 className="mt-4 font-heading text-3xl sm:text-5xl font-semibold text-[var(--color-ink)] leading-tight">
            It doesn&apos;t search your photos.
            <br />
            It recognizes you.
          </h2>
          <p className="mt-5 text-[var(--color-muted)] leading-relaxed max-w-md">
            Our matching engine scans every photo from the event and finds
            every frame you appear in — full face, side profile, even
            partially hidden in a crowd. What would take hours of manual
            tagging happens the moment your selfie is verified.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4 sm:gap-8">
            {[
              { value: "99.2%", label: "Match accuracy" },
              { value: "< 4s", label: "Average match time" },
              { value: "0", label: "Selfies stored as images" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-2xl font-semibold text-[var(--color-ink)]">
                  {stat.value}
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Visual side — GSAP-driven face-mesh sequence */}
        <div className="order-1 lg:order-2 flex justify-center">
          <div
            ref={imageWrapRef}
            className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(22,22,22,0.25)]"
          >
            <Image
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400&auto=format&fit=crop"
              alt="Guests at a golden-hour event, candid group moment"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Mesh dots at each detected face position */}
            {FACES.map((face, i) => (
              <span
                key={face.label}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                className="absolute w-2 h-2 rounded-full bg-[var(--color-gold)] shadow-[0_0_6px_1px_rgba(200,155,99,0.7)]"
                style={{ left: `${face.x}%`, top: `${face.y}%`, opacity: 0 }}
              />
            ))}

            {/* Bounding box on the "matched" face */}
            <div
              ref={boxRef}
              className="absolute w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 border-[var(--color-gold)]"
              style={{
                left: `${FACES[LOCKED_FACE_INDEX].x}%`,
                top: `${FACES[LOCKED_FACE_INDEX].y}%`,
                transform: "translate(-50%, -55%)",
                opacity: 0,
                boxShadow: "0 0 0 4px rgba(200,155,99,0.15)",
              }}
            />

            {/* Match result label */}
            <div
              ref={labelRef}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                background: "rgba(15,13,10,0.7)",
                backdropFilter: "blur(10px)",
                opacity: 0,
              }}
            >
              <span className="text-white text-xs tracking-wide">Match found</span>
              <span ref={scoreRef} className="text-[var(--color-gold)] font-heading font-semibold text-sm">
                0.0%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}