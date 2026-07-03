"use client";

import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import { authFetch } from "../../lib/api";

const API_BASE_URL = "http://127.0.0.1:8000";

interface UploadStatus {
  total: number;
  done: number;
  processing: number;
  queued: number;
  failed: number;
}

interface VipProfile {
  id: string;
  name: string;
  added_by_organizer_at: string;
}

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [qrStyle, setQrStyle] = useState<"classic" | "rounded_coral" | "dots" | "coral_gradient">("rounded_coral");
  const [qrCenterText, setQrCenterText] = useState("");
  const [qrLogo, setQrLogo] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [qrGenerating, setQrGenerating] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const qrLogoInputRef = useRef<HTMLInputElement>(null);
  const [qrFgColor, setQrFgColor] = useState("#1f1f1f");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");

  const QR_STYLE_OPTIONS: { id: typeof qrStyle; label: string }[] = [
    { id: "rounded_coral", label: "Rounded" },
    { id: "classic", label: "Classic" },
    { id: "dots", label: "Dots" },
    { id: "coral_gradient", label: "Gradient" },
  ];

  const [vipMode, setVipMode] = useState<"group" | "single">("group");
  const [vipName, setVipName] = useState("");
  const [vipSinglePhoto, setVipSinglePhoto] = useState<File | null>(null);
  const [vipGroupPhoto, setVipGroupPhoto] = useState<File | null>(null);
  const [vipList, setVipList] = useState<VipProfile[]>([]);
  const [vipUploading, setVipUploading] = useState(false);
  const [vipError, setVipError] = useState("");
  const vipSingleFileInputRef = useRef<HTMLInputElement>(null);
  const vipGroupFileInputRef = useRef<HTMLInputElement>(null);
  const [vipThumbnails, setVipThumbnails] = useState<Record<string, string>>({});
  const [editingVipId, setEditingVipId] = useState<string | null>(null);
  const [editingVipName, setEditingVipName] = useState("");

  const [liveSyncSupported, setLiveSyncSupported] = useState(false);
  const [liveSyncActive, setLiveSyncActive] = useState(false);
  const [liveSyncCount, setLiveSyncCount] = useState(0);
  const [liveSyncError, setLiveSyncError] = useState("");
  const liveSyncSeenFiles = useRef<Set<string>>(new Set());
  const liveSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  // --- Generate a styled QR preview whenever style/text/logo changes ---
  async function generateQrPreview() {
    setQrGenerating(true);

    const formData = new FormData();
    formData.append("style", qrStyle);
    formData.append("fg_color", qrFgColor);
    formData.append("bg_color", qrBgColor);
    if (qrCenterText) formData.append("center_text", qrCenterText);
    if (qrLogo) formData.append("logo", qrLogo);

    try {
      const res = await authFetch(`/api/events/${eventId}/qr/style/`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setQrPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    } catch {
      // Preview just won't update -- organizer can retry by changing a setting again
    }

    setQrGenerating(false);
  }


  useEffect(() => {
    generateQrPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrStyle, qrFgColor, qrBgColor, qrCenterText, qrLogo, eventId]);

  function downloadQrHd() {
    if (!qrPreviewUrl) return;
    const link = document.createElement("a");
    link.href = qrPreviewUrl;
    link.download = "event-qr-code.png";
    link.click();
  }

  // Poll the backend every 3 seconds once an upload has started, so the
  // organizer can watch the album finish processing in real time.
  useEffect(() => {
    if (!uploading && !status) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/events/${eventId}/upload-status/`
        );
        const data: UploadStatus = await res.json();
        setStatus(data);
      } catch {
        // Silently ignore -- polling will retry on the next interval
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [eventId, uploading, status]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage("");
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
        setVipList((prev) =>
          prev.map((v) => (v.id === vipId ? { ...v, name: trimmed } : v))
        );
      }
    } catch {
      // If renaming fails, the name just stays as it was -- no error banner
      // needed here, it's a low-stakes action the organizer can just retry
    }

    setEditingVipId(null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Please choose a ZIP file first.");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setErrorMessage("Only .zip files are supported.");
      return;
    }

    setUploading(true);
    setErrorMessage("");
    setUploadProgress(0);

    const CHUNK_SIZE = 10 * 1024 * 1024;
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
      const chunkBlob = selectedFile.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunkBlob, "chunk");
      formData.append("chunk_index", String(i));
      formData.append("total_chunks", String(totalChunks));
      formData.append("upload_id", uploadId);
      formData.append("filename", selectedFile.name);

      let attempt = 0;
      let success = false;
      let lastErrorDetail = "";

      while (attempt < 3 && !success) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/events/${eventId}/upload-chunk/`,
            { method: "POST", body: formData }
          );
          if (res.ok) {
            success = true;
          } else {
            const data = await res.json().catch(() => ({}));
            lastErrorDetail = data.error || `Server returned ${res.status}`;
            attempt++;
            if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
          }
        } catch {
          lastErrorDetail = "Network connection lost";
          attempt++;
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
        }
      }

      if (!success) {
        const percentDone = Math.round((i / totalChunks) * 100);
        setErrorMessage(
          `Upload stopped at ${percentDone}% (piece ${i + 1} of ${totalChunks} failed: ${lastErrorDetail}). ` +
          `Please check your internet connection and try uploading again.`
        );
        setUploading(false);
        return;
      }

      setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    setStatus({ total: 0, done: 0, processing: 0, queued: 0, failed: 0 });
    setUploading(false);
  }

  async function loadVipList() {
    try {
      const res = await authFetch(`/api/events/${eventId}/vip/list/`);
      if (!res.ok) return;
      const data: VipProfile[] = await res.json();
      setVipList(data);

      // Fetch each thumbnail image separately (JWT-protected, so it can't
      // be used as a plain <img src>, same reasoning as the QR code fix)
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

  // --- Add VIPs from a group photo (auto-detects every face) ---
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

  // --- Add one VIP individually ---
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

  // --- Remove a VIP ---
  async function handleRemoveVip(vipId: string) {
    try {
      await authFetch(`/api/events/${eventId}/vip/${vipId}/`, { method: "DELETE" });
      setVipList((prev) => prev.filter((v) => v.id !== vipId));
    } catch {
      setVipError("Could not remove this VIP. Please try again.");
    }
  }

  // Feature detection on mount ---
  useEffect(() => {
    setLiveSyncSupported(typeof (window as any).showDirectoryPicker === "function");
  }, []);

  async function uploadSinglePhoto(file: File) {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await authFetch(`/api/events/${eventId}/upload-single/`, {
      method: "POST",
      body: formData,
    });
    return res.ok;
  }

  async function startLiveSync() {
    setLiveSyncError("");
    try {
      // @ts-ignore -- showDirectoryPicker isn't in default TS lib yet
      const dirHandle = await window.showDirectoryPicker();

      setLiveSyncActive(true);
      liveSyncSeenFiles.current.clear();
      setLiveSyncCount(0);

      liveSyncIntervalRef.current = setInterval(async () => {
        try {
          for await (const entry of (dirHandle as any).values()) {
            if (entry.kind !== "file") continue;
            if (liveSyncSeenFiles.current.has(entry.name)) continue;

            const isImage = /\.(jpe?g|png|heic)$/i.test(entry.name);
            if (!isImage) continue;

            liveSyncSeenFiles.current.add(entry.name);
            const file = await entry.getFile();
            const success = await uploadSinglePhoto(file);
            if (success) {
              setLiveSyncCount((prev) => prev + 1);
            }
          }
        } catch {
          // A single poll cycle failing shouldn't stop the whole session --
          // it'll just retry on the next interval
        }
      }, 3000);
    } catch (err) {
      // User cancelled the folder picker -- not an error worth surfacing
      setLiveSyncActive(false);
    }
  }

  function stopLiveSync() {
    if (liveSyncIntervalRef.current) {
      clearInterval(liveSyncIntervalRef.current);
      liveSyncIntervalRef.current = null;
    }
    setLiveSyncActive(false);
  }

  // Clean up the interval if the organizer navigates away mid-sync
  useEffect(() => {
    return () => {
      if (liveSyncIntervalRef.current) clearInterval(liveSyncIntervalRef.current);
    };
  }, []);

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


  const progressPercent =
    status && status.total > 0
      ? Math.round((status.done / status.total) * 100)
      : 0;

  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-hairline px-6 h-16 flex items-center">
        <p className="text-xl font-bold text-ink">
          Photo<span className="text-coral">Flow</span>
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-ink mb-2">Upload your album</h1>
        <p className="text-muted mb-10">
          Upload the full event album as a single ZIP file. JPG, PNG, and
          iPhone (HEIC) photos are all supported.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="lift-on-hover cursor-pointer rounded-2xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-12 text-center transition-colors"
        >
          <svg
            className="mx-auto mb-3 text-coral"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          <p className="font-semibold text-ink">
            {selectedFile ? selectedFile.name : "Click to choose a ZIP file"}
          </p>
          <p className="text-sm text-muted mt-1">
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
              : "Up to 2GB per album"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {errorMessage && (
          <p className="text-red-600 text-sm mt-4">{errorMessage}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="focus-ring btn-primary w-full mt-6 rounded-full px-7 py-3.5 font-semibold disabled:opacity-40"
        >
          {uploading ? "Uploading..." : "Upload album"}
        </button>
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-coral-tint overflow-hidden">
              <div
                className="h-full bg-coral transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {status && (
          <div className="mt-10 rounded-2xl border border-hairline p-6">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>Processing photos</span>
              <span>
                {status.done} / {status.total || "…"}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-coral-tint overflow-hidden">
              <div
                className="h-full bg-coral transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {status.failed > 0 && (
              <p className="text-sm text-red-600 mt-3">
                {status.failed} photo{status.failed > 1 ? "s" : ""} failed to
                process.
              </p>
            )}
            {status.total > 0 && status.done === status.total && (
              <p className="text-sm text-coral font-medium mt-3">
                ✓ All photos processed. Your event is ready for guests.
              </p>
            )}
          </div>
        )}

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
                  </div>
                  <button
                    onClick={stopLiveSync}
                    className="w-full rounded-full border border-hairline px-5 py-2.5 text-sm text-ink hover:border-coral transition-colors"
                  >
                    Stop Live Sync
                  </button>
                  <p className="text-xs text-muted mt-3">
                    Keep this browser tab open while syncing.
                  </p>
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


        {/* ============================================================
            QR CODE CUSTOMIZATION SECTION
           ============================================================ */}
        <div className="mt-10 rounded-2xl border border-hairline p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink mb-1">Your guest QR code</h2>
          <p className="text-sm text-muted mb-6">
            Customize it to match your event, then download the HD version to print
            or display at the venue.
          </p>

          {/* Live preview -- click to zoom */}
          <div
            onClick={() => qrPreviewUrl && setQrZoomOpen(true)}
            className="relative w-56 h-56 mx-auto rounded-xl border border-hairline overflow-hidden cursor-zoom-in bg-white"
          >
            {qrGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {qrPreviewUrl && (
              <Image src={qrPreviewUrl} alt="Event QR code" fill className="object-contain p-3" unoptimized />
            )}
          </div>

          {/* Style presets */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            {QR_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setQrStyle(opt.id)}
                className={`rounded-lg py-2 text-xs font-medium border transition-colors ${
                  qrStyle === opt.id
                    ? "border-coral bg-coral-tint text-coral-dark"
                    : "border-hairline text-muted hover:border-coral/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">QR color</label>
              <div className="flex items-center gap-2 rounded-lg border border-hairline px-2 py-1.5">
                <input
                  type="color"
                  value={qrFgColor}
                  onChange={(e) => setQrFgColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
                />
                <span className="text-xs text-muted uppercase">{qrFgColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Background color</label>
              <div className="flex items-center gap-2 rounded-lg border border-hairline px-2 py-1.5">
                <input
                  type="color"
                  value={qrBgColor}
                  onChange={(e) => setQrBgColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
                />
                <span className="text-xs text-muted uppercase">{qrBgColor}</span>
              </div>
            </div>
          </div>

          {/* Center content: logo OR text */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-ink mb-1">
              Center badge <span className="text-muted font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrCenterText}
                onChange={(e) => {
                  setQrCenterText(e.target.value);
                  setQrLogo(null);
                }}
                placeholder="e.g. Event initials"
                maxLength={3}
                className="focus-ring flex-1 rounded-lg border border-hairline px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => qrLogoInputRef.current?.click()}
                className="shrink-0 rounded-lg border border-hairline px-3 py-2 text-sm text-ink hover:border-coral transition-colors"
              >
                {qrLogo ? "Logo chosen" : "Upload logo"}
              </button>
              <input
                ref={qrLogoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setQrLogo(e.target.files?.[0] || null);
                  setQrCenterText("");
                }}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted mt-1.5">
              A logo takes priority over text if both are set. Leave both empty for a plain QR.
            </p>
          </div>

          <button
            onClick={downloadQrHd}
            disabled={!qrPreviewUrl || qrGenerating}
            className="focus-ring btn-primary w-full mt-6 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-40"
          >
            Download HD QR code
          </button>
        </div>

        {/* Zoom modal */}
        {qrZoomOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setQrZoomOpen(false)}
          >
            <div className="bg-white rounded-2xl p-6">
              <img src={qrPreviewUrl} alt="Event QR code, enlarged" className="w-80 h-80 object-contain" />
            </div>
          </div>
        )}

        {/* ============================================================
            VIP / FAMILY ACCESS SECTION
           ============================================================ */}
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
      </div>
    </div>
  );
}