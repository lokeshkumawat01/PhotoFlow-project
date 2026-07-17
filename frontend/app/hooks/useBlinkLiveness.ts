"use client";

import { API_BASE_URL } from "../lib/config";

const POLL_INTERVAL_MS = 200; // fast enough to catch a blink almost as it happens
const MAX_ATTEMPTS = 900; // 200ms * 900 = 3 minute safety timeout
const REMINDER_EVERY = 150; // ~30s between "still waiting" nudges
const EAR_DROP_RATIO = 0.88; // ratio drop that counts as a blink

type BlinkResult =
  | { blinked: true; frame: Blob }
  | { blinked: false };

/**
 * Polls the liveness-frame endpoint until it detects a natural blink (via
 * eye-aspect-ratio drop), or times out. Extracted from the
 * handleStartBlinkCapture function that used to live inline in
 * event/[qrToken]/page.tsx.
 */
export function useBlinkLiveness(captureFrameBlob: () => Promise<Blob | null>) {
  async function waitForBlink(
    onReminder: (message: string) => void
  ): Promise<BlinkResult> {
    let previousEar: number | null = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      const frameBlob = await captureFrameBlob();
      if (!frameBlob) {
        attempts++;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      const form = new FormData();
      form.append("frame", frameBlob, "frame.jpg");

      try {
        const res = await fetch(`${API_BASE_URL}/api/guest/liveness-frame/`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        const currentEar: number | null = data.ear;

        if (currentEar !== null && previousEar !== null) {
          const dropRatio = currentEar / previousEar;
          if (dropRatio <= EAR_DROP_RATIO) {
            // Blink detected right now -- reuse the frame we already have,
            // no extra capture step needed.
            return { blinked: true, frame: frameBlob };
          }
        }

        if (currentEar !== null) {
          previousEar = currentEar;
        }
      } catch {
        // Ignore a single failed frame check and keep monitoring.
      }

      attempts++;
      if (attempts % REMINDER_EVERY === 0) {
        onReminder("Still waiting — please look at the camera and blink naturally.");
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    return { blinked: false };
  }

  return { waitForBlink };
}
