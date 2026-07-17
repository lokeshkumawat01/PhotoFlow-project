"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Fires exactly once per real page load (initial visit or a hard refresh)
 * -- NOT on client-side navigation between pages. Lives in the root layout,
 * which only mounts once per actual document load.
 */
export default function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 950);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center"
          style={{
            // Inline position + a very high z-index on purpose, rather than
            // relying only on Tailwind's z-[100] class -- guarantees this
            // sits above literally everything (hero images, sticky header,
            // modals) with zero risk of another stacking context winning.
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            background: "rgba(20, 20, 20, 0.65)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <FaceScanFrame />

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-6"
          >
            <Image
              src="/logo.png"
              alt="PhotoFlow"
              width={140}
              height={36}
              className="w-auto h-6 mx-auto brightness-0 invert opacity-90"
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * A face-detection scan frame: four corner brackets (the classic
 * Face ID / AF viewfinder marker) with a gold scan-line sweeping up and
 * down inside them. Directly represents what the product actually does
 * -- AI face matching -- instead of a generic spinner.
 */
function FaceScanFrame() {
  const bracketBase = "absolute w-5 h-5 border-[var(--color-gold)]";

  return (
    <div className="relative w-16 h-16">
      <span className={`${bracketBase} top-0 left-0 border-t-2 border-l-2 rounded-tl-md`} />
      <span className={`${bracketBase} top-0 right-0 border-t-2 border-r-2 rounded-tr-md`} />
      <span className={`${bracketBase} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md`} />
      <span className={`${bracketBase} bottom-0 right-0 border-b-2 border-r-2 rounded-br-md`} />

      <motion.div
        className="absolute left-1.5 right-1.5 h-[2px] rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          boxShadow: "0 0 8px 1px var(--color-gold)",
        }}
        animate={{ top: ["6px", "58px", "6px"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-3 rounded-full border border-[var(--color-gold)]/40"
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}