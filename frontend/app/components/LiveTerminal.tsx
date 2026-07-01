"use client";

import { useEffect, useState } from "react";

/**
 * Mirrors the "live pipeline log" terminal from the reference site --
 * a fake but realistic-looking sequence of log lines that types itself
 * out, representing PhotoFlow's actual backend pipeline (face detection,
 * embedding, matching) rather than a generic loading animation.
 */
const LOG_LINES = [
  { text: "$ photoflow run --event=sharma-wedding-2026", type: "command" },
  { text: "[INFO] Loading InsightFace model on CUDAExecutionProvider...", type: "info" },
  { text: "[OK] GPU detected — buffalo_l model ready", type: "ok" },
  { text: "[INFO] Scanning album: 1,842 photos", type: "info" },
  { text: "[OK] 2,317 faces detected across album", type: "ok" },
  { text: "[INFO] Guest selfie received — computing signature...", type: "info" },
  { text: "[MATCH] 14 photos matched in 0.8s", type: "match" },
  { text: "[OK] Signed preview URLs generated", type: "ok" },
];

export default function LiveTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LOG_LINES.length) {
      const resetTimer = setTimeout(() => setVisibleLines(0), 2500);
      return () => clearTimeout(resetTimer);
    }
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), 550);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  const colorFor: Record<string, string> = {
    command: "text-starlight",
    info: "text-starlight-dim",
    ok: "text-gold",
    match: "text-gold-bright font-semibold",
  };

  return (
    <div className="rounded-xl bg-surface border border-starlight/10 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised border-b border-starlight/10">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <p className="font-mono text-xs text-starlight-dim ml-2">
          photoflow-pipeline.log
        </p>
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed min-h-[200px]">
        {LOG_LINES.slice(0, visibleLines).map((line, i) => (
          <p key={i} className={colorFor[line.type]}>
            {line.text}
          </p>
        ))}
        <span className="terminal-cursor text-gold">▋</span>
      </div>
    </div>
  );
}