"use client";

import { useEffect, useRef } from "react";

let svgTextCache: Promise<string> | null = null;
function getSvgText() {
  if (!svgTextCache) {
    svgTextCache = fetch("/infinite-1.svg").then((res) => {
      if (!res.ok) throw new Error(`Failed to load infinite-1.svg: ${res.status}`);
      return res.text();
    });
  }
  return svgTextCache;
}

interface InfinityRibbonProps {
  className?: string;
  style?: React.CSSProperties;
  /** Called once the SVG is injected, with the 17 individual layer groups
   * (each a real, unique hand-drawn path variant) so the caller can
   * animate them independently — this is what actually recreates the
   * source site's "wave" illusion, instead of rotating the whole SVG
   * as one rigid unit. */
  onLayersReady?: (layers: SVGGElement[]) => void;
}

export default function InfinityRibbon({ className, style, onLayersReady }: InfinityRibbonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    getSvgText()
      .then((raw) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = raw;

        const svgEl = containerRef.current.querySelector("svg");
        if (!svgEl) return;
        svgEl.setAttribute("width", "100%");
        svgEl.setAttribute("height", "100%");
        svgEl.style.display = "block";

        // FIX: the exported SVG wraps its 17 real layers in ONE outer <g>
        // (<svg><defs/><g><g/>x17</g></svg>), so ":scope > g" was only ever
        // finding that single wrapper — layers.length was 1, and the whole
        // staggered "wave" (each layer 3s later than the last, 17 distinct
        // hand-drawn paths) never actually ran; everything moved as one
        // rigid block. Going one level deeper (":scope > g > g") reaches
        // the real 17 layers.
        const layers = Array.from(svgEl.querySelectorAll<SVGGElement>(":scope > g > g"));
        layers.forEach((g) => {
          g.style.transformBox = "fill-box";
          g.style.transformOrigin = "50% 50%";
        });

        onLayersReady?.(layers);
      })
      .catch((err) => {
        console.error("[InfinityRibbon] failed to load SVG:", err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} style={style} aria-hidden />;
}