"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "../../lib/api";

interface VipProfile {
  id: string;
  name: string;
  added_by_organizer_at: string;
}

/**
 * VIP / family access: add people by group photo (auto face-detect) or
 * one-by-one, rename, remove, and see thumbnails. Extracted from
 * dashboard/[eventId]/page.tsx.
 */
export default function VipManager({ eventId }: { eventId: string }) {
  const [vipMode, setVipMode] = useState<"group" | "single">("group");
  const [vipName, setVipName] = useState("");
  const [vipSinglePhoto, setVipSinglePhoto] = useState<File | null>(null);
  const [vipGroupPhoto, setVipGroupPhoto] = useState<File | null>(null);
  const [vipList, setVipList] = useState<VipProfile[]>([]);
  const [vipUploading, setVipUploading] = useState(false);
  const [vipError, setVipError] = useState("");
  const [vipThumbnails, setVipThumbnails] = useState<Record<string, string>>({});
  const [editingVipId, setEditingVipId] = useState<string | null>(null);
  const [editingVipName, setEditingVipName] = useState("");

  const vipSingleFileInputRef = useRef<HTMLInputElement>(null);
  const vipGroupFileInputRef = useRef<HTMLInputElement>(null);

  async function loadVipList() {
    try {
      const res = await authFetch(`/api/events/${eventId}/vip/list/`);
      if (!res.ok) return;
      const data: VipProfile[] = await res.json();
      setVipList(data);

      // Fetch each thumbnail image separately (JWT-protected, so it can't
      // be used as a plain <img src>).
      for (const vip of data) {
        authFetch(`/api/events/${eventId}/vip/${vip.id}/thumbnail/`)
          .then((res) => (res.ok ? res.blob() : null))
          .then((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setVipThumbnails((prev) => ({ ...prev, [vip.id]: url }));
            }
          })
          .catch(() => {
            // No thumbnail available -- the initial-letter avatar will show instead
          });
      }
    } catch {
      // Silently ignore -- the list will just stay empty
    }
  }

  useEffect(() => {
    loadVipList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleAddVipGroup() {
    if (!vipGroupPhoto) {
      setVipError("Please choose a group photo first.");
      return;
    }
    setVipUploading(true);
    setVipError("");

    const formData = new FormData();
    formData.append("group_photo", vipGroupPhoto);

    try {
      const res = await authFetch(`/api/events/${eventId}/vip/group/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setVipError(data.error || "Could not process this photo. Try a clearer one.");
        setVipUploading(false);
        return;
      }

      setVipGroupPhoto(null);
      if (vipGroupFileInputRef.current) vipGroupFileInputRef.current.value = "";
      await loadVipList();
    } catch {
      setVipError("Could not connect to the server.");
    }

    setVipUploading(false);
  }

  async function handleAddVipSingle() {
    if (!vipName.trim() || !vipSinglePhoto) {
      setVipError("Please enter a name and choose a clear face photo.");
      return;
    }
    setVipUploading(true);
    setVipError("");

    const formData = new FormData();
    formData.append("name", vipName.trim());
    formData.append("reference_photo", vipSinglePhoto);

    try {
      const res = await authFetch(`/api/events/${eventId}/vip/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setVipError(data.error || "Could not add this VIP. Try a clearer photo.");
        setVipUploading(false);
        return;
      }

      setVipName("");
      setVipSinglePhoto(null);
      if (vipSingleFileInputRef.current) vipSingleFileInputRef.current.value = "";
      await loadVipList();
    } catch {
      setVipError("Could not connect to the server.");
    }

    setVipUploading(false);
  }

  async function handleRemoveVip(vipId: string) {
    try {
      await authFetch(`/api/events/${eventId}/vip/${vipId}/`, { method: "DELETE" });
      setVipList((prev) => prev.filter((v) => v.id !== vipId));
    } catch {
      setVipError("Could not remove this VIP. Please try again.");
    }
  }

  function startEditingVip(vip: VipProfile) {
    setEditingVipId(vip.id);
    setEditingVipName(vip.name);
  }

  async function saveVipName(vipId: string) {
    const trimmed = editingVipName.trim();
    if (!trimmed) {
      setEditingVipId(null);
      return;
    }

    try {
      const res = await authFetch(`/api/events/${eventId}/vip/${vipId}/rename/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setVipList((prev) => prev.map((v) => (v.id === vipId ? { ...v, name: trimmed } : v)));
      }
    } catch {
      // If renaming fails, the name just stays as it was -- low-stakes, retryable
    }

    setEditingVipId(null);
  }

  return (
    <div className="mt-10 rounded-2xl border border-hairline p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <svg
          className="text-coral"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l2.4 6.6L21 9l-5 4.4L17.4 21 12 17.3 6.6 21 8 13.4 3 9l6.6-.4z" />
        </svg>
        <h2 className="text-lg font-semibold text-ink">VIP / Family Access</h2>
      </div>
      <p className="text-sm text-muted mb-6 leading-relaxed">
        Add family members or VIP guests here. When they take their selfie at
        the event, they'll get access to every photo in the album instead of
        just their matched photos.
      </p>

      <div className="flex gap-2 mb-5 rounded-full bg-coral-tint/50 p-1">
        <button
          onClick={() => setVipMode("group")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            vipMode === "group" ? "bg-white text-coral-dark shadow-sm" : "text-muted"
          }`}
        >
          Group photo
        </button>
        <button
          onClick={() => setVipMode("single")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            vipMode === "single" ? "bg-white text-coral-dark shadow-sm" : "text-muted"
          }`}
        >
          Add one person
        </button>
      </div>

      {vipMode === "group" && (
        <div>
          <p className="text-sm text-muted mb-3">
            Upload one photo with everyone visible — each face detected becomes a VIP.
          </p>
          <div
            onClick={() => vipGroupFileInputRef.current?.click()}
            className="lift-on-hover cursor-pointer rounded-xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-6 text-center transition-colors"
          >
            <svg
              className="mx-auto mb-2 text-coral"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p className="text-sm font-semibold text-ink">
              {vipGroupPhoto ? vipGroupPhoto.name : "Click to choose a group photo"}
            </p>
            <input
              ref={vipGroupFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setVipGroupPhoto(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {vipError && <p className="text-red-600 text-sm mt-3">{vipError}</p>}

          <button
            onClick={handleAddVipGroup}
            disabled={vipUploading || !vipGroupPhoto}
            className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
          >
            {vipUploading ? "Detecting faces..." : "Add everyone from this photo"}
          </button>
        </div>
      )}

      {vipMode === "single" && (
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            type="text"
            value={vipName}
            onChange={(e) => setVipName(e.target.value)}
            placeholder="e.g. Priya's Mother"
            className="focus-ring w-full rounded-lg border border-hairline px-3 py-2.5 text-sm outline-none mb-4"
          />

          <label className="block text-sm font-medium text-ink mb-1">Reference photo</label>
          <div
            onClick={() => vipSingleFileInputRef.current?.click()}
            className="lift-on-hover cursor-pointer rounded-xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-6 text-center transition-colors"
          >
            <svg
              className="mx-auto mb-2 text-coral"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
            <p className="text-sm font-semibold text-ink">
              {vipSinglePhoto ? vipSinglePhoto.name : "Click to choose a clear face photo"}
            </p>
            <input
              ref={vipSingleFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setVipSinglePhoto(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {vipError && <p className="text-red-600 text-sm mt-3">{vipError}</p>}

          <button
            onClick={handleAddVipSingle}
            disabled={vipUploading || !vipName.trim() || !vipSinglePhoto}
            className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
          >
            {vipUploading ? "Adding..." : "Add VIP"}
          </button>
        </div>
      )}

      {vipList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-hairline">
          <p className="text-sm font-medium text-ink mb-3">
            {vipList.length} VIP{vipList.length > 1 ? "s" : ""} added
          </p>
          <div className="space-y-2">
            {vipList.map((vip) => (
              <div
                key={vip.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {vipThumbnails[vip.id] ? (
                    <img
                      src={vipThumbnails[vip.id]}
                      alt={vip.name}
                      className="shrink-0 w-8 h-8 rounded-full object-cover border border-hairline"
                    />
                  ) : (
                    <span className="shrink-0 w-8 h-8 rounded-full bg-coral-tint text-coral-dark text-xs font-semibold flex items-center justify-center">
                      {vip.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  {editingVipId === vip.id ? (
                    <input
                      type="text"
                      value={editingVipName}
                      onChange={(e) => setEditingVipName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveVipName(vip.id)}
                      onBlur={() => saveVipName(vip.id)}
                      autoFocus
                      className="focus-ring flex-1 min-w-0 rounded-lg border border-hairline px-2 py-1 text-sm outline-none"
                    />
                  ) : (
                    <span className="text-sm text-ink font-medium truncate">{vip.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {editingVipId !== vip.id && (
                    <button
                      onClick={() => startEditingVip(vip)}
                      className="text-muted hover:text-coral-dark transition-colors"
                      aria-label="Rename"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveVip(vip.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
