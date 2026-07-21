"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, blurReveal, viewportOnce } from "@/app/lib/motion";
import Button from "@/app/components/ui/Button";

export default function QrExperience() {
  return (
    <section className="bg-[var(--color-bg)] py-24 sm:py-32 overflow-hidden">
      <div className="container-page grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Text side */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <span className="text-xs font-semibold text-[var(--color-gold-dark)] uppercase tracking-[0.2em]">
            The QR Experience
          </span>
          <h2 className="mt-4 font-heading text-3xl sm:text-5xl font-semibold text-[var(--color-ink)] leading-tight">
            One code.
            <br />
            Every guest&apos;s memories.
          </h2>
          <p className="mt-5 text-[var(--color-muted)] leading-relaxed max-w-md">
            Every event gets a single, custom-branded QR code — printed on
            welcome boards, table cards, or entrance banners. No app to
            install, no account to create. Guests scan once and their private
            gallery is ready the moment AI matching finishes.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Print-ready, high-resolution download",
              "Works with any phone camera, zero setup",
              "Each scan opens a private, guest-only gallery",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-ink)]/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Link href="/signup">
              <Button size="lg">Generate your QR code</Button>
            </Link>
          </div>
        </motion.div>

        {/* Visual side — phone mockup with animated QR + scan line */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={blurReveal}
          className="flex justify-center lg:justify-end"
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative w-[260px] sm:w-[300px] aspect-[9/19] rounded-[2.25rem] bg-[#0f0d0a] p-2.5 shadow-[0_30px_60px_-20px_rgba(22,22,22,0.35)]">
      {/* Notch */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0f0d0a] rounded-full z-10" />

      <div className="relative w-full h-full rounded-[1.75rem] bg-[var(--color-bg)] overflow-hidden flex flex-col items-center justify-center px-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted)] mb-6">
          Sharma Wedding
        </p>

        {/* QR frame with scan-line, visually consistent with PageLoader's face-scan motif */}
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl bg-white border border-[var(--color-hairline)] shadow-sm p-3">
          <QrPattern />

          <motion.div
            className="absolute left-3 right-3 h-[2px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
              boxShadow: "0 0 8px 1px var(--color-gold)",
            }}
            animate={{ top: ["12px", "148px", "12px"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Corner brackets — same visual language as the page loader's scanner */}
          {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map(
            (pos, i) => (
              <span
                key={pos}
                className={`absolute w-4 h-4 border-[var(--color-gold)] ${pos} ${
                  i === 0
                    ? "border-t-2 border-l-2 rounded-tl-md"
                    : i === 1
                    ? "border-t-2 border-r-2 rounded-tr-md"
                    : i === 2
                    ? "border-b-2 border-l-2 rounded-bl-md"
                    : "border-b-2 border-r-2 rounded-br-md"
                }`}
              />
            )
          )}
        </div>

        <p className="mt-6 text-[11px] text-[var(--color-muted)] text-center max-w-[160px] leading-relaxed">
          Scan to find your photos
        </p>
      </div>
    </div>
  );
}

// Static decorative QR-style grid (not a real scannable code — purely visual)
function QrPattern() {
  const cells = [
    "1110101110111",
    "1000101010001",
    "1011101110101",
    "1010001000101",
    "1011111110101",
    "0000010000000",
    "1111100011111",
    "0001011010100",
    "1101111110111",
    "1000001010001",
    "1011101110101",
    "1010101000101",
    "1110101110111",
  ];

  return (
    <div
      className="w-full h-full"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(13, 1fr)",
        gridTemplateRows: "repeat(13, 1fr)",
        gap: "1px",
      }}
    >
      {cells.map((row, r) =>
        row.split("").map((cell, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              background: cell === "1" ? "var(--color-ink)" : "transparent",
              borderRadius: "1px",
            }}
          />
        ))
      )}
    </div>
  );
}