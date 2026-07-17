"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { authFetch } from "../../lib/api";

type QrStyle = "classic" | "rounded_coral" | "dots" | "coral_gradient";

const QR_STYLE_OPTIONS: { id: QrStyle; label: string }[] = [
  { id: "rounded_coral", label: "Rounded" },
  { id: "classic", label: "Classic" },
  { id: "dots", label: "Dots" },
  { id: "coral_gradient", label: "Gradient" },
];

/**
 * Guest QR code customization: style/color/logo pickers, live preview,
 * zoom modal, and HD download. Extracted from dashboard/[eventId]/page.tsx.
 */
export default function QrGenerator({ eventId }: { eventId: string }) {
  const [qrStyle, setQrStyle] = useState<QrStyle>("rounded_coral");
  const [qrCenterText, setQrCenterText] = useState("");
  const [qrLogo, setQrLogo] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [qrGenerating, setQrGenerating] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [qrFgColor, setQrFgColor] = useState("#1f1f1f");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const qrLogoInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <div className="mt-10 rounded-2xl border border-hairline p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink mb-1">Your guest QR code</h2>
        <p className="text-sm text-muted mb-6">
          Customize it to match your event, then download the HD version to print
          or display at the venue.
        </p>

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
    </>
  );
}
