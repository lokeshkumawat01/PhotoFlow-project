"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

const navLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Log in", href: "/login" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (scrolled) setDrawerOpen(false);
  }, [scrolled]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-500",
          scrolled ? "bg-black/85 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        )}
      >
        <div
          className="container-page flex items-center justify-between"
          style={{ height: "clamp(56px, 9vw, 68px)" }}
        >
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="PhotoFlow"
              width={160}
              height={40}
              className="w-auto"
              style={{ height: "clamp(28px, 6vw, 44px)" }}
              priority
            />
          </Link>

          <AnimatePresence>
            {scrolled && (
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="hidden md:flex items-center gap-10 lg:gap-12"
              >
                {navLinks.slice(0, 3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[13px] tracking-wide uppercase text-white/65 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <AnimatePresence>
              {scrolled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden md:block"
                >
                  <Link
                    href="/signup"
                    className="text-[13px] tracking-wide uppercase text-white border border-white/30 px-4 py-2 rounded-full hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors whitespace-nowrap"
                  >
                    Get started
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Touch target guaranteed 44x44px minimum, even though the icon itself is 20-22px */}
            <button
              className="flex items-center justify-center focus-ring rounded-lg text-white -mr-1.5"
              style={{ width: 44, height: 44 }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} className="sm:hidden" />
              <Menu size={22} className="hidden sm:block" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Side panel — slides in from the right */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 z-[70] h-[100dvh] w-[min(90vw,420px)] bg-[#0f0d0a] border-l border-white/10 flex flex-col"
            >
              <div
                className="flex items-center justify-between px-5 sm:px-8 shrink-0"
                style={{ height: "clamp(56px, 9vw, 68px)" }}
              >
                <Image
                  src="/logo.png"
                  alt="PhotoFlow"
                  width={160}
                  height={40}
                  className="w-auto"
                  style={{ height: "clamp(26px, 5.5vw, 40px)" }}
                />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center focus-ring rounded-lg text-white -mr-1.5"
                  style={{ width: 44, height: 44 }}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 flex flex-col justify-center gap-1 px-5 sm:px-8 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-white/10 py-3.5 sm:py-4"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className="font-heading text-white hover:text-[var(--color-gold)] transition-colors"
                      style={{ fontSize: "clamp(1.25rem, 5vw, 1.875rem)" }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="px-5 sm:px-8 pb-6 sm:pb-8 shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + navLinks.length * 0.06, duration: 0.4 }}
                >
                  <Link
                    href="/signup"
                    onClick={() => setDrawerOpen(false)}
                    className="block text-center text-sm uppercase tracking-wide text-white bg-[var(--color-gold)] px-5 py-3.5 rounded-full hover:bg-[var(--color-gold-dark)] transition-colors"
                  >
                    Get started
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}