"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
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
          scrolled ? "bg-[#080724] backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        )}
      >
        <div
          className="container-page flex items-center justify-between"
          style={{ height: "clamp(72px, 7vw, 84px)" }}
        >
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="PhotoFlow"
              width={220}
              height={70}
              priority
              className="w-auto object-contain"
              style={{ height: "clamp(40px, 6vw, 60px)" }}
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
                    className="text-[14px] font-semibold tracking-[0.15em] uppercase text-white hover:text-white/82 transition-all duration-300 relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-white/82 hover:after:w-full after:transition-all"
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
                    className="text-[14px] tracking-wide uppercase text-white border border-white/30 px-6 py-3 backdrop-blur-xl rounded-full font-semibold bg-white/5 hover:bg-white hover:text-[#080724]  hover:border-[#080724] transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,.08)] whitespace-nowrap"
                  >
                    Get started
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Touch target guaranteed 44x44px minimum, even though the icon itself is 20-22px */}
            <button
              className="flex items-center justify-center cursor-pointer focus-ring rounded-lg text-white -mr-1.5 transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ width: 44, height: 44 }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={28} className="sm:hidden" />
              <Menu size={28} className="hidden sm:block hover:scale-110 transition-transform duration-300" />
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
              className="fixed top-0 right-0 z-[70] h-[100dvh] w-[min(90vw,460px)] bg-[#0f0d0a] backdrop-blur-3xl border-l border-white/10 flex flex-col"
            >
              <div
                className="flex items-center justify-between px-5 sm:px-8 shrink-0 bg-[#080724] border-b border-white/20"
                style={{ height: "clamp(56px, 9vw, 68px)" }}
              >
                <Image
                  src="/logo.png"
                  alt="PhotoFlow"
                  width={200}
                  height={70}
                  className="h-10 w-auto object-contain"
                  style={{ height: "clamp(26px, 5.5vw, 40px)" }}
                />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full cursor-pointer text-white transition-colors duration-300 hover:bg-white/10"
                  style={{ width: 44, height: 44 }}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 flex flex-col justify-center gap-1 px-5 bg-[#080724] sm:px-8 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.15 + i * 0.06,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group border-b border-white/10 py-4"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between"
                    >
                      <span
                        className="font-heading text-white text-[clamp(1.5rem,4vw,2.2rem)] font-semibold transition-all duration-300] group-hover:translate-x-2"
                      >
                        {link.label}
                      </span>

                      <span
                        className="
                          opacity-0
                          -translate-x-2
                          transition-all
                          duration-300
                          group-hover:opacity-100
                          group-hover:translate-x-0
                          items-center
                        "
                      >
                        <ArrowRight
                          size={28}
                          className="text-white/50 transition-all duration-300 group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="px-5 sm:px-8 p-6 items-center sm:pb-8 shrink-0 bg-[#080724]/75 backdrop-blur-2xl border-t border-white/5">
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + navLinks.length * 0.06, duration: 0.4 }}
                >
                  <Link
                    href="/signup"
                    onClick={() => setDrawerOpen(false)}
                    className="
                      group
                      flex
                      items-center
                      justify-center
                      gap-2

                      w-full

                      rounded-full

                      bg-gradient-to-r
                      from-[#F5C542]
                      via-[#EAB308]
                      to-[#C98A00]

                      py-4

                      text-[15px]
                      font-semibold
                      tracking-wide
                      text-black

                      transition-all
                      duration-300

                      hover:scale-[1.02]
                      hover:shadow-[0_12px_35px_rgba(234,179,8,.35)]
                      active:scale-[0.98]
                    "
                  >
                    <span>Get Started</span>

                    <ArrowRight
                      size={18}
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
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