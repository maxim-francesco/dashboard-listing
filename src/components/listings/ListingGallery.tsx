import { useState } from "react";
import { ArrowLeft, Car } from "lucide-react";
import { Link } from "react-router-dom";

interface ListingGalleryProps {
  images?: { url: string }[];
  title: string;
}

export default function ListingGallery({ images = [], title }: ListingGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.clientWidth > 0) {
      const index = Math.round(container.scrollLeft / container.clientWidth);
      setCurrentIndex(index);
    }
  };

  const hasImages = images && images.length > 0;

  return (
    <div className="relative w-full h-[220px] bg-muted overflow-hidden shrink-0 select-none">
      {/* Back button */}
      <Link
        to="/listings"
        className="absolute top-3 left-3 z-10 w-[34px] h-[34px] rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>

      {hasImages ? (
        <div className="relative w-full h-full">
          <div
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={`${title} - Imaginea ${idx + 1}`}
                className="snap-center shrink-0 w-full h-[220px] object-cover"
              />
            ))}
          </div>
          {/* Counter pill */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs rounded-[10px] px-2.5 py-0.5">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted">
          <Car className="w-[44px] h-[44px] text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
