"use client";

export interface MatchedPhoto {
  photo_id: string;
  preview_url: string;
  similarity: number;
}

export interface FulfilledVideo {
  video_id: string;
  title?: string;
  linked_photo_id?: string | null;
  video_url: string;
  downloadable: boolean;
}

interface MatchedGalleryProps {
  photos: MatchedPhoto[];
  videos: FulfilledVideo[];
  isVip: boolean;
  vipName: string;
  downloadingAll: boolean;
  newPhotoToast: string;
  onDownloadAll: () => void;
  onDownloadSingle: (previewUrl: string, photoId: string) => void;
  onOpenLightbox: (index: number) => void;
  onSearchAgain: () => void;
}

/**
 * The "results" state of the guest journey: header, download-all CTA,
 * any unlinked event videos, and the matched-photo grid.
 * Extracted from event/[qrToken]/page.tsx.
 */
export default function MatchedGallery({
  photos,
  videos,
  isVip,
  vipName,
  downloadingAll,
  newPhotoToast,
  onDownloadAll,
  onDownloadSingle,
  onOpenLightbox,
  onSearchAgain,
}: MatchedGalleryProps) {
  const unlinkedVideos = videos.filter((v) => !v.linked_photo_id);

  return (
    <div>
      {newPhotoToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          {newPhotoToast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ink">
          {isVip
            ? `Welcome, ${vipName}!`
            : `${photos.length} Photo${photos.length > 1 ? "s" : ""} Found`}
        </h2>
        <span className="text-xs font-semibold text-coral-dark bg-coral-tint rounded-full px-3 py-1">
          {isVip ? "VIP Access · Full Album" : "Matched to you"}
        </span>
      </div>

      {isVip && (
        <p className="text-sm text-coral-dark bg-coral-tint rounded-xl px-4 py-3 mb-6 text-center leading-relaxed">
          You have full access to all {photos.length} photos from this event.
        </p>
      )}

      <button
        onClick={onDownloadAll}
        disabled={downloadingAll}
        className="focus-ring btn-primary w-full mb-6 rounded-full px-5 py-3.5 font-semibold disabled:opacity-50"
      >
        {downloadingAll ? "Preparing download..." : "Download all photos"}
      </button>

      {unlinkedVideos.length > 0 && (
        <div className="mb-6 space-y-4">
          {unlinkedVideos.map((v) => (
            <div key={v.video_id}>
              {v.title && <p className="text-sm font-semibold text-ink mb-2">{v.title}</p>}
              <video
                src={v.video_url}
                controls
                controlsList={v.downloadable ? "" : "nodownload"}
                onContextMenu={(e) => !v.downloadable && e.preventDefault()}
                className="w-full rounded-xl shadow-md bg-black"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo, index) => {
          const linkedVideo = videos.find((v) => v.linked_photo_id === photo.photo_id);
          return (
            <div
              key={photo.photo_id}
              className="group relative rounded-xl overflow-hidden border border-hairline"
            >
              <img
                src={photo.preview_url}
                alt="Matched photo"
                onClick={() => onOpenLightbox(index)}
                className="w-full aspect-square object-cover cursor-pointer"
              />

              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

              <button
                onClick={() => onDownloadSingle(photo.preview_url, photo.photo_id)}
                className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:bg-coral hover:[&>svg]:stroke-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Download this photo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </button>

              {linkedVideo && (
                <a
                  href={linkedVideo.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-full bg-coral flex items-center justify-center shadow-lg"
                  aria-label="Watch video"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </a>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onSearchAgain}
        className="focus-ring btn-secondary w-full mt-6 rounded-full px-5 py-3.5 font-semibold"
      >
        Search Again
      </button>
    </div>
  );
}
