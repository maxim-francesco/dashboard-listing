import { parseVideoSource } from "@/lib/video";
import { CARD, CARD_HEADER, CARD_LABEL } from "@/components/today/cardRecipe";
import { ExternalLink } from "lucide-react";

interface ListingVideoBlockProps {
  videoValue?: string | null;
}

export default function ListingVideoBlock({ videoValue }: ListingVideoBlockProps) {
  const videoSource = parseVideoSource(videoValue);

  if (videoSource.kind === "unusable") {
    return null;
  }

  if (videoSource.kind === "cloudinary") {
    return (
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <span className={CARD_LABEL}>Prezentare Video</span>
        </div>
        <div className="p-3">
          <video
            src={videoSource.url}
            controls
            playsInline
            className="w-full aspect-video rounded-md bg-black object-contain block"
          />
        </div>
      </div>
    );
  }

  if (videoSource.kind === "youtube") {
    return (
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <span className={CARD_LABEL}>Prezentare Video</span>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-b-lg">
          <iframe
            src={videoSource.embedUrl}
            title="Prezentare Video YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  if (videoSource.kind === "tiktok") {
    if (videoSource.videoId !== null && videoSource.embedUrl !== null) {
      return (
        <div className={CARD}>
          <div className={CARD_HEADER}>
            <span className={CARD_LABEL}>Prezentare Video</span>
            <a
              href={videoSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-normal"
            >
              Deschide pe TikTok <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-b-lg bg-black">
            <iframe
              src={videoSource.embedUrl}
              title="Prezentare Video TikTok"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      );
    }

    return (
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <span className={CARD_LABEL}>Prezentare Video</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Linkul scurt TikTok nu poate fi redat direct în pagină. Apasă butonul de mai jos pentru a viziona clipul pe TikTok.
          </p>
          <a
            href={videoSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Vizionează video pe TikTok
          </a>
        </div>
      </div>
    );
  }

  return null;
}
