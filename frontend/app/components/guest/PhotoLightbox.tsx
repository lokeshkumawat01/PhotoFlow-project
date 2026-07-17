"use client";

import { useEffect, useRef } from "react";
import { MatchedPhoto } from "./MatchedGallery";

interface PhotoLightboxProps {
  photos: MatchedPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDownload: (previewUrl: string, photoId: string) => void;
}

const MIN_SWIPE_DISTANCE = 50; // pixels -- avoids triggering on tiny accidental drags

/**
 * Fullscreen lightbox for a matched photo, with arrow-key nav, swipe nav,
 * and a per-photo download button. Extracted from event/[qrToken]/page.tsx;
 * touch-swipe tracking (previously two refs + three handlers on the page)
 * now lives entirely inside this component instead of the parent.
 */
export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  onDownload,
}: PhotoLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const photo = photos[index];

  function showNext() {
    onIndexChange((index + 1) % photos.length);
  }

  function showPrevious() {
    onIndexChange((index - 1 + photos.length) % photos.length);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") showNext();
      else if (e.key === "ArrowLeft") showPrevious();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length]);

  function handleTouchStart(e: React.TouchEvent) {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;

    if (distance > MIN_SWIPE_DISTANCE) showNext(); // swiped left -> next
    else if (distance < -MIN_SWIPE_DISTANCE) showPrevious(); // swiped right -> previous

    touchStartX.current = null;
    touchEndX.current = null;
  }

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>

      {/* Arrow buttons -- hidden on touch devices (sm and below), swipe is used instead there */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          showPrevious();
        }}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
        aria-label="Previous photo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <img
        src={photo.preview_url}
        alt="Matched photo, enlarged"
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
        draggable={false}
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          showNext();
        }}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
        aria-label="Next photo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Small position indicator -- helps on mobile where arrow buttons are hidden */}
      <p className="sm:hidden absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
        {index + 1} / {photos.length}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload(photo.preview_url, photo.photo_id);
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 btn-primary rounded-full px-6 py-2.5 text-sm font-semibold"
      >
        Download this photo
      </button>
    </div>
  );
}
