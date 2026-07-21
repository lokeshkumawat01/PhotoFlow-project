"use client";

import { forwardRef, useRef } from "react";
import { cn, mergeRefs } from "../../lib/utils";
import type { BackgroundSceneState } from "../../lib/motion-tokens";
import { useSceneTransition } from "../../hooks/useSceneTransition";

interface SceneWrapperProps extends React.HTMLAttributes<HTMLElement> {
  /** Which GlobalScene background state should be active while this scene is in view. */
  backgroundState: BackgroundSceneState;
  /** Full-viewport height by default — most scenes should be exactly one screen tall so pin math is predictable. */
  fullHeight?: boolean;
}

/**
 * The cinematic scene container (Creative Direction §7/§8). Every scene in
 * the storyboard — Arrival, Discovery, QR→Phone, Face Mesh, Gallery Reveal,
 * etc. — is built as <SceneWrapper> plus a useGSAPScene()/useScrollTimeline()
 * call inside it for the scene's own choreography.
 *
 * SceneWrapper's own job is narrow and specific: register this scene's
 * section with the GlobalScene background (via useSceneTransition) and give
 * every scene the same full-viewport sizing so pin calculations behave
 * consistently. It intentionally does NOT own the scene's internal timeline
 * — that's built per-scene in Phase 2+, since each scene's choreography is
 * different (that's the whole point of "no two scenes look the same").
 *
 * Usage (Phase 2+):
 *   function FaceMeshScene() {
 *     const ref = useRef<HTMLElement>(null);
 *     useGSAPScene(...) // build this scene's own timeline against `ref`
 *     return (
 *       <SceneWrapper ref={ref} backgroundState="technical">
 *         ...
 *       </SceneWrapper>
 *     );
 *   }
 */
const SceneWrapper = forwardRef<HTMLElement, SceneWrapperProps>(function SceneWrapper(
  { backgroundState, fullHeight = true, className, children, ...props },
  forwardedRef
) {
  // Always call the hook unconditionally (rules of hooks), against a stable
  // internal ref, merged with whatever ref the caller forwarded (typically
  // the ref returned by useGSAPScene for that scene's own timeline).
  const internalRef = useRef<HTMLElement>(null);
  useSceneTransition(internalRef, backgroundState);

  return (
    <section
      ref={mergeRefs(internalRef, forwardedRef)}
      className={cn(
        "relative w-full flex items-center",
        fullHeight && "min-h-[100dvh]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
});

export default SceneWrapper;
