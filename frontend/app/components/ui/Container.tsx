import { cn } from "../../lib/utils";

/**
 * Centered container — reserved for Trust/CTA bookend scenes where
 * centered gravity is correct (Creative Direction §4). Most scenes should
 * use <Grid> instead, which supports the asymmetric 12-column layout.
 */
export default function Container({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("container-page", className)} {...props}>
      {children}
    </div>
  );
}
