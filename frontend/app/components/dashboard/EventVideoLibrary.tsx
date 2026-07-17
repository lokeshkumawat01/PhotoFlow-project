"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "../../lib/api";

interface EventVideo {
  id: string;
  title: string;
  visibility: "public" | "restricted";
}

/**
 * Organizer-uploaded event videos (teasers, highlights) with public/restricted
 * visibility. Extracted from dashboard/[eventId]/page.tsx.
 */
export default function EventVideoLibrary({ eventId }: { eventId: string }) {
  const [eventVideoTitle, setEventVideoTitle] = useState("");
  const [eventVideoVisibility, setEventVideoVisibility] = useState<"public" | "restricted">("restricted");
  const [eventVideoFile, setEventVideoFile] = useState<File | null>(null);
  const [eventVideosList, setEventVideosList] = useState<EventVideo[]>([]);
  const [eventVideoUploading, setEventVideoUploading] = useState(false);
  const [eventVideoError, setEventVideoError] = useState("");
  const eventVideoFileInputRef = useRef<HTMLInputElement>(null);

  async function loadEventVideosList() {
    try {
      const res = await authFetch(`/api/events/${eventId}/videos/list/`);
      if (!res.ok) return;
      setEventVideosList(await res.json());
    } catch {
      // Silently ignore
    }
  }

  useEffect(() => {
    loadEventVideosList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleUploadEventVideo() {
    if (!eventVideoFile) {
      setEventVideoError("Please choose a video file.");
      return;
    }
    setEventVideoUploading(true);
    setEventVideoError("");

    const formData = new FormData();
    formData.append("video", eventVideoFile);
    formData.append("title", eventVideoTitle.trim());
    formData.append("visibility", eventVideoVisibility);

    try {
      const res = await authFetch(`/api/events/${eventId}/videos/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setEventVideoError(data.error || "Could not upload this video.");
        setEventVideoUploading(false);
        return;
      }
      setEventVideoTitle("");
      setEventVideoFile(null);
      if (eventVideoFileInputRef.current) eventVideoFileInputRef.current.value = "";
      await loadEventVideosList();
    } catch {
      setEventVideoError("Could not connect to the server.");
    }
    setEventVideoUploading(false);
  }

  async function handleDeleteEventVideo(videoId: string) {
    try {
      await authFetch(`/api/events/${eventId}/videos/${videoId}/`, { method: "DELETE" });
      setEventVideosList((prev) => prev.filter((v) => v.id !== videoId));
    } catch {
      setEventVideoError("Could not remove this video. Please try again.");
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-hairline p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink mb-1">Event Videos</h2>
      <p className="text-sm text-muted mb-6 leading-relaxed">
        Upload teaser or general event videos. "Public" videos are visible to
        every guest; "Restricted" videos are visible only to VIPs and
        Video-Access members.
      </p>

      <label className="block text-sm font-medium text-ink mb-1">Title (optional)</label>
      <input
        type="text"
        value={eventVideoTitle}
        onChange={(e) => setEventVideoTitle(e.target.value)}
        placeholder="e.g. Pre-wedding teaser"
        className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none mb-4"
      />

      <label className="block text-sm font-medium text-ink mb-1">Visibility</label>
      <div className="flex gap-2 mb-4 rounded-full bg-coral-tint/50 p-1">
        <button
          onClick={() => setEventVideoVisibility("public")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            eventVideoVisibility === "public" ? "bg-white text-coral-dark shadow-sm" : "text-muted"
          }`}
        >
          Public
        </button>
        <button
          onClick={() => setEventVideoVisibility("restricted")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            eventVideoVisibility === "restricted" ? "bg-white text-coral-dark shadow-sm" : "text-muted"
          }`}
        >
          VIP + Video-Access only
        </button>
      </div>

      <div
        onClick={() => eventVideoFileInputRef.current?.click()}
        className="lift-on-hover cursor-pointer rounded-xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-6 text-center transition-colors"
      >
        <p className="text-sm font-semibold text-ink">
          {eventVideoFile ? eventVideoFile.name : "Click to choose a video file"}
        </p>
        <input
          ref={eventVideoFileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setEventVideoFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      {eventVideoError && <p className="text-red-600 text-sm mt-3">{eventVideoError}</p>}

      <button
        onClick={handleUploadEventVideo}
        disabled={eventVideoUploading || !eventVideoFile}
        className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
      >
        {eventVideoUploading ? "Uploading..." : "Upload Video"}
      </button>

      {eventVideosList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-hairline">
          <p className="text-sm font-medium text-ink mb-3">
            {eventVideosList.length} video{eventVideosList.length > 1 ? "s" : ""} uploaded
          </p>
          <div className="space-y-2">
            {eventVideosList.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink font-medium truncate">{v.title || "Untitled"}</p>
                  <p className="text-xs text-muted">{v.visibility === "public" ? "Public" : "Restricted"}</p>
                </div>
                <button
                  onClick={() => handleDeleteEventVideo(v.id)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
