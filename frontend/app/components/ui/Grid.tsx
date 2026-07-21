import { cn } from "../../lib/utils";

/**
 * The 12-column asymmetric scene grid (Creative Direction §4). Use this —
 * not Container — as the default wrapper for scene content, and place
 * children with <Grid.Item span={...} start={...}> to get left-heavy,
 * right-heavy, or overlapping compositions instead of everything centered.
 */
export default function Grid({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("scene-grid", className)} {...props}>
      {children}
    </div>
  );
}

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How many of the 12 columns this item occupies (1–12). */
  span: number;
  /** Which column this item starts on (1–12). Omit to auto-place. */
  start?: number;
}

function GridItem({ span, start, className, style, children, ...props }: GridItemProps) {
  return (
    <div
      className={cn(className)}
      style={{
        gridColumn: start ? `${start} / span ${span}` : `span ${span}`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

Grid.Item = GridItem;
