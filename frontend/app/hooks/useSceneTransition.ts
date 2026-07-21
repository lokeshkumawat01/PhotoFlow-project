"use client";

import { useEffect, RefObject } from "react";
import { ensureGsapRegistered, ScrollTrigger } from "../lib/gsap-config";
import { useSceneBackground } from "../components/GlobalScene";
import type { BackgroundSceneState } from "../lib/motion-tokens";

/**
 * Connects a scene's scroll position to the GlobalScene background.
 * Call once per scene component (in Phase 2+, as each scene is built),
 * passing the ref of the scene's outer element and which background
 * state should be active while that scene is in view.
 *
 * Usage:
 *   const sceneRef = useRef<HTMLDivElement>(null);
 *   useSceneTransition(sceneRef, "technical"); // Face Detection scene
 *
 * This is intentionally separate from useGSAPScene/useScrollTimeline —
 * a scene's internal choreography and its effect on the shared background
 * are two different concerns, and a scene might want to fine-tune when
 * the background shifts relative to when its own timeline starts.
 */
export function useSceneTransition(
  ref: RefObject<HTMLElement | null>,
  state: BackgroundSceneState,
  options: { start?: string; end?: string } = {}
) {
  const { setState } = useSceneBackground();

  useEffect(() => {
    if (!ref.current) return;
    ensureGsapRegistered();

    const el = ref.current;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: options.start ?? "top center",
      end: options.end ?? "bottom center",
      onEnter: () => setState(state),
      onEnterBack: () => setState(state),
    });

    return () => trigger.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
