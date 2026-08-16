import { useState, useEffect, useCallback, useRef } from "react";
import { Car, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ListingGalleryDesktopProps {
  images?: { url: string }[];
  title: string;
}

export default function ListingGalleryDesktop({
  images = [],
  title,
}: ListingGalleryDesktopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const hasImages = images && images.length > 0;
  const total = images.length;

  const goTo = useCallback(
    (idx: number) => {
      if (total === 0) return;
      const next = (idx + total) % total;
      setCurrentIndex(next);
    },
    [total]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Keyboard nav (arrows always; Esc closes fullscreen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hasImages) return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasImages, goNext, goPrev, isFullscreen]);

  // Keep active thumbnail in view
  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-idx="${currentIndex}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentIndex]);

  const EMPTY = (
    <div className="flex flex-col items-center justify-center w-full h-[500px] text-muted-foreground bg-card border border-border rounded-lg">
      <Car className="w-[64px] h-[64px] text-muted-foreground" />
    </div>
  );

  return (
    <div className="w-full shrink-0 select-none">
      {/* HERO IMAGE */}
      <div className="relative w-full h-[500px] bg-card border border-border rounded-lg overflow-hidden">
        {hasImages ? (
          <>
            {/* Fullscreen button */}
            <button
              type="button"
              aria-label="Ecran complet"
              onClick={() => setIsFullscreen(true)}
              className="absolute top-3 right-3 z-20 w-[34px] h-[34px] rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>

            <img
              src={images[currentIndex].url}
              alt={`${title} - Imaginea ${currentIndex + 1}`}
              className="w-full h-[500px] object-contain"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Imaginea anterioară"
                  onClick={goPrev}
                  className="absolute top-1/2 left-3 -translate-y-1/2 z-10 w-[38px] h-[38px] rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  type="button"
                  aria-label="Imaginea următoare"
                  onClick={goNext}
                  className="absolute top-1/2 right-3 -translate-y-1/2 z-10 w-[38px] h-[38px] rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </>
        ) : (
          EMPTY
        )}
      </div>

      {/* COUNTER + THUMBNAILS */}
      {hasImages && (
        <div className="px-1 pt-2.5">
          <div className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {total}
          </div>
          {total > 1 && (
            <div
              ref={thumbsRef}
              className="flex gap-2 mt-2 overflow-x-auto scrollbar-none pb-1"
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-idx={idx}
                  aria-label={`Vezi imaginea ${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`shrink-0 w-[96px] h-[64px] rounded-md overflow-hidden border-2 transition-colors ${
                    idx === currentIndex ? "border-primary" : "border-transparent opacity-70"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95 border-none flex items-center justify-center [&>button]:hidden">
          {hasImages && (
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                type="button"
                aria-label="Închide"
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <span className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-sm text-white/85">
                {currentIndex + 1} / {total}
              </span>

              <img
                src={images[currentIndex].url}
                alt={`${title} - Imaginea ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {total > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Imaginea anterioară"
                    onClick={goPrev}
                    className="absolute top-1/2 left-3 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-7 h-7 text-white" />
                  </button>
                  <button
                    type="button"
                    aria-label="Imaginea următoare"
                    onClick={goNext}
                    className="absolute top-1/2 right-3 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-7 h-7 text-white" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
