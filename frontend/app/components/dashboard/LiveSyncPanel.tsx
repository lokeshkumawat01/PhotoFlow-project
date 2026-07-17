"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "../../lib/api";

interface LiveSyncFileState {
  lastSize: number;
  stableTicks: number;
  attempts: number;
}

const MAX_UPLOAD_ATTEMPTS = 8;
const STABLE_TICKS_REQUIRED = 2;
const TICK_INTERVAL_MS = 3000;

/**
 * Watches a local folder (via the File System Access API) and auto-uploads
 * new photos as they land — e.g. from a camera's WiFi transfer app — plus a
 * manual multi-file fallback for browsers without folder-watching support.
 * Extracted from dashboard/[eventId]/page.tsx.
 */
export default function LiveSyncPanel({ eventId }: { eventId: string }) {
  const [liveSyncSupported, setLiveSyncSupported] = useState(false);
  const [liveSyncActive, setLiveSyncActive] = useState(false);
  const [liveSyncCount, setLiveSyncCount] = useState(0);
  const [liveSyncError, setLiveSyncError] = useState("");
  const [liveSyncPendingCount, setLiveSyncPendingCount] = useState(0);
  const [liveSyncOffline, setLiveSyncOffline] = useState(false);

  const liveSyncDoneFiles = useRef<Set<string>>(new Set());
  const liveSyncPendingFiles = useRef<Map<string, LiveSyncFileState>>(new Map());
  const liveSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveSyncDirHandleRef = useRef<any>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLiveSyncSupported(typeof (window as any).showDirectoryPicker === "function");
  }, []);

  useEffect(() => {
    return () => {
      if (liveSyncIntervalRef.current) clearInterval(liveSyncIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    function handleOnline() {
      setLiveSyncOffline(false);
      if (liveSyncActive) runLiveSyncTick();
    }
    function handleOffline() {
      setLiveSyncOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSyncActive]);

  async function uploadSinglePhoto(file: File): Promise<boolean> {
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await authFetch(`/api/events/${eventId}/upload-single/`, {
        method: "POST",
        body: formData,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function* walkDirectoryRecursive(
    dirHandle: any,
    path = ""
  ): AsyncGenerator<{ entry: any; path: string }> {
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;
      if (entry.kind === "directory") {
        yield* walkDirectoryRecursive(entry, entryPath);
      } else {
        yield { entry, path: entryPath };
      }
    }
  }

  async function startLiveSync() {
    setLiveSyncError("");
    try {
      // @ts-ignore -- showDirectoryPicker isn't in default TS lib yet
      const dirHandle = await window.showDirectoryPicker();
      liveSyncDirHandleRef.current = dirHandle;

      setLiveSyncActive(true);
      setLiveSyncOffline(false);
      liveSyncDoneFiles.current.clear();
      liveSyncPendingFiles.current.clear();
      setLiveSyncCount(0);
      setLiveSyncPendingCount(0);

      liveSyncIntervalRef.current = setInterval(runLiveSyncTick, TICK_INTERVAL_MS);
      // Run once immediately instead of waiting 3s for the first tick
      runLiveSyncTick();
    } catch {
      setLiveSyncActive(false);
    }
  }

  async function runLiveSyncTick() {
    const dirHandle = liveSyncDirHandleRef.current;
    if (!dirHandle) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setLiveSyncOffline(true);
      return;
    }
    setLiveSyncOffline(false);

    try {
      const currentFileKeys = new Set<string>();

      for await (const { entry, path } of walkDirectoryRecursive(dirHandle)) {
        const isImage = /\.(jpe?g|png|heic|heif|webp)$/i.test(entry.name);
        if (!isImage) continue;
        if (liveSyncDoneFiles.current.has(path)) continue;

        currentFileKeys.add(path);

        const file = await entry.getFile();

        const tracked = liveSyncPendingFiles.current.get(path);
        if (!tracked || tracked.lastSize !== file.size) {
          liveSyncPendingFiles.current.set(path, {
            lastSize: file.size,
            stableTicks: 0,
            attempts: tracked?.attempts ?? 0,
          });
          continue;
        }

        const stableTicks = tracked.stableTicks + 1;
        if (stableTicks < STABLE_TICKS_REQUIRED) {
          liveSyncPendingFiles.current.set(path, { ...tracked, stableTicks });
          continue;
        }

        if (tracked.attempts >= MAX_UPLOAD_ATTEMPTS) continue;

        const success = await uploadSinglePhoto(file);

        if (success) {
          liveSyncDoneFiles.current.add(path);
          liveSyncPendingFiles.current.delete(path);
          setLiveSyncCount((prev) => prev + 1);
        } else {
          liveSyncPendingFiles.current.set(path, {
            lastSize: file.size,
            stableTicks,
            attempts: tracked.attempts + 1,
          });
        }
      }

      for (const key of liveSyncPendingFiles.current.keys()) {
        if (!currentFileKeys.has(key)) {
          liveSyncPendingFiles.current.delete(key);
        }
      }

      setLiveSyncPendingCount(liveSyncPendingFiles.current.size);
    } catch {
      // A single failed tick just gets retried on the next interval
    }
  }

  function stopLiveSync() {
    if (liveSyncIntervalRef.current) {
      clearInterval(liveSyncIntervalRef.current);
      liveSyncIntervalRef.current = null;
    }
    liveSyncDirHandleRef.current = null;
    setLiveSyncActive(false);
    setLiveSyncPendingCount(0);
  }

  async function handleFallbackFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLiveSyncActive(true);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      const success = await uploadSinglePhoto(file);
      if (success) uploaded++;
    }

    setLiveSyncCount((prev) => prev + uploaded);
    setLiveSyncActive(false);
    if (fallbackFileInputRef.current) fallbackFileInputRef.current.value = "";
  }

  return (
    <div className="mt-10 rounded-2xl border border-hairline p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <svg className="text-coral" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        <h2 className="text-lg font-semibold text-ink">Live Sync</h2>
      </div>

      {liveSyncSupported ? (
        <>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Point this at the folder your camera transfers photos to (via its WiFi
            app). New photos upload automatically as they arrive — no need to wait
            until the event ends.
          </p>

          {!liveSyncActive ? (
            <button
              onClick={startLiveSync}
              className="focus-ring btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold"
            >
              Enable Live Sync
            </button>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-sm text-coral-dark font-medium mb-3">
                <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                Live Sync active — {liveSyncCount} photo{liveSyncCount !== 1 ? "s" : ""} synced
                {liveSyncOffline && (
                  <span className="block text-amber-600 font-normal mt-1">
                    ⚠ No connection — will resume automatically when back online
                  </span>
                )}
                {!liveSyncOffline && liveSyncPendingCount > 0 && (
                  <span className="block text-muted font-normal mt-1">
                    {liveSyncPendingCount} photo{liveSyncPendingCount !== 1 ? "s" : ""} waiting to upload...
                  </span>
                )}
              </div>
              <button
                onClick={stopLiveSync}
                className="w-full rounded-full border border-hairline px-5 py-2.5 text-sm text-ink hover:border-coral transition-colors"
              >
                Stop Live Sync
              </button>
              <p className="text-xs text-muted mt-3">Keep this browser tab open while syncing.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Live Sync works best in Chrome or Edge. In this browser, you can still
            upload new photos in batches as the event goes on:
          </p>

          <div
            onClick={() => fallbackFileInputRef.current?.click()}
            className="lift-on-hover cursor-pointer rounded-xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-6 text-center transition-colors"
          >
            <p className="text-sm font-semibold text-ink">
              {liveSyncActive ? "Uploading..." : "Select new photos to upload"}
            </p>
            <input
              ref={fallbackFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFallbackFilesSelected}
              className="hidden"
            />
          </div>

          {liveSyncCount > 0 && (
            <p className="text-sm text-coral-dark font-medium mt-3">
              {liveSyncCount} photo{liveSyncCount !== 1 ? "s" : ""} synced so far
            </p>
          )}
        </>
      )}

      {liveSyncError && <p className="text-red-600 text-sm mt-3">{liveSyncError}</p>}
    </div>
  );
}
