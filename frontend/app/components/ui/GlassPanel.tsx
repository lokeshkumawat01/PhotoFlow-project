import { cn } from "../../lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  onWarmSurface?: boolean;
  /** Adds the accent scan-line motif — use only during active AI states (Creative Direction §9). */
  scanning?: boolean;
}

/**
 * The Soft Glass Surface (L3) as a standalone primitive, distinct from
 * Card — GlassPanel is for framing a moment (a viewfinder, a scanning
 * region, a technical readout), not for holding arbitrary content like
 * Card is. Used by the Face Detection / Face Mesh / AI Matching scenes.
 */
export default function GlassPanel({
  onWarmSurface = false,
  scanning = false,
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] relative overflow-hidden",
        onWarmSurface ? "glass-panel-warm" : "surface-glass",
        scanning && "scan-line",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
