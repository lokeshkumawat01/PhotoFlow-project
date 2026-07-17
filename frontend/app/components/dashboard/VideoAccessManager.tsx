"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "../../lib/api";

interface VideoAccessMember {
  id: string;
  name: string;
  added_by_organizer_at: string;
}

/**
 * Close friends/family who can see every restricted video (but not the full
 * photo album — that's VIP access). Extracted from dashboard/[eventId]/page.tsx.
 */
export default function VideoAccessManager({ eventId }: { eventId: string }) {
  const [vaName, setVaName] = useState("");
  const [vaPhoto, setVaPhoto] = useState<File | null>(null);
  const [vaList, setVaList] = useState<VideoAccessMember[]>([]);
  const [vaUploading, setVaUploading] = useState(false);
  const [vaError, setVaError] = useState("");
  const vaFileInputRef = useRef<HTMLInputElement>(null);

  async function loadVaList() {
    try {
      const res = await authFetch(`/api/events/${eventId}/video-access/list/`);
      if (!res.ok) return;
      setVaList(await res.json());
    } catch {
      // Silently ignore
    }
  }

  useEffect(() => {
    loadVaList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleAddVideoAccess() {
    if (!vaName.trim() || !vaPhoto) {
      setVaError("Please enter a name and choose a clear face photo.");
      return;
    }
    setVaUploading(true);
    setVaError("");

    const formData = new FormData();
    formData.append("name", vaName.trim());
    formData.append("reference_photo", vaPhoto);

    try {
      const res = await authFetch(`/api/events/${eventId}/video-access/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setVaError(data.error || "Could not add this member. Try a clearer photo.");
        setVaUploading(false);
        return;
      }
      setVaName("");
      setVaPhoto(null);
      if (vaFileInputRef.current) vaFileInputRef.current.value = "";
      await loadVaList();
    } catch {
      setVaError("Could not connect to the server.");
    }
    setVaUploading(false);
  }

  async function handleRemoveVideoAccess(vaId: string) {
    try {
      await authFetch(`/api/events/${eventId}/video-access/${vaId}/`, { method: "DELETE" });
      setVaList((prev) => prev.filter((v) => v.id !== vaId));
    } catch {
      setVaError("Could not remove this member. Please try again.");
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-hairline p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <svg
          className="text-coral"
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        <h2 className="text-lg font-semibold text-ink">Video-Access Members</h2>
      </div>
      <p className="text-sm text-muted mb-6 leading-relaxed">
        Add close friends/family who should see every restricted video (but not
        download them) once they take their selfie at the event.
      </p>

      <label className="block text-sm font-medium text-ink mb-1">Name</label>
      <input
        type="text"
        value={vaName}
        onChange={(e) => setVaName(e.target.value)}
        placeholder="e.g. Rahul's Cousin"
        className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none mb-4"
      />

      <label className="block text-sm font-medium text-ink mb-1">Reference photo</label>
      <div
        onClick={() => vaFileInputRef.current?.click()}
        className="lift-on-hover cursor-pointer rounded-xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-6 text-center transition-colors"
      >
        <p className="text-sm font-semibold text-ink">
          {vaPhoto ? vaPhoto.name : "Click to choose a clear face photo"}
        </p>
        <input
          ref={vaFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setVaPhoto(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      {vaError && <p className="text-red-600 text-sm mt-3">{vaError}</p>}

      <button
        onClick={handleAddVideoAccess}
        disabled={vaUploading || !vaName.trim() || !vaPhoto}
        className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
      >
        {vaUploading ? "Adding..." : "Add Video-Access Member"}
      </button>

      {vaList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-hairline">
          <p className="text-sm font-medium text-ink mb-3">
            {vaList.length} member{vaList.length > 1 ? "s" : ""} added
          </p>
          <div className="space-y-2">
            {vaList.map((va) => (
              <div
                key={va.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-2.5"
              >
                <span className="text-sm text-ink font-medium truncate">{va.name}</span>
                <button
                  onClick={() => handleRemoveVideoAccess(va.id)}
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
