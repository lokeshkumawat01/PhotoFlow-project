import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Ref, RefCallback } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Combines multiple refs (object refs and/or callback refs) into one ref
 * callback. Used by SceneWrapper to merge its own internal ref (needed for
 * useSceneTransition) with whatever ref a caller forwards in (typically the
 * ref returned by useGSAPScene for that scene's own timeline).
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined | null>): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}
