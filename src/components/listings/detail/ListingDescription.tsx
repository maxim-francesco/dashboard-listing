import { useState, useEffect, useRef } from "react";

interface ListingDescriptionProps {
  description?: string | null;
  variant?: "mobile" | "desktop";
}

export default function ListingDescription({
  description,
  variant = "mobile",
}: ListingDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canOverflow, setCanOverflow] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const isMobile = variant === "mobile";

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!isExpanded) {
        setCanOverflow(el.scrollHeight > el.clientHeight + 1);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [description, isExpanded]);

  if (!description || description.trim() === "") return null;

  return (
    <div className="w-full select-none">
      <h2 className="text-[17px] font-semibold mt-1 mb-2.5 px-0.5 text-foreground">
        Descriere
      </h2>
      {isMobile ? (
        <div className="bg-card border border-border rounded-xl p-4">
          <p
            ref={textRef}
            className={`whitespace-pre-line text-foreground leading-relaxed text-[14px] ${
              !isExpanded ? "line-clamp-[12]" : ""
            }`}
          >
            {description.trim()}
          </p>
          {canOverflow && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-3 text-[13px] font-medium text-primary hover:underline self-start cursor-pointer block"
            >
              {isExpanded ? "Arată mai puțin" : "Arată tot"}
            </button>
          )}
        </div>
      ) : (
        <div>
          <p
            ref={textRef}
            className={`whitespace-pre-line text-foreground leading-relaxed text-[13px] ${
              !isExpanded ? "line-clamp-[5]" : ""
            }`}
          >
            {description.trim()}
          </p>
          {canOverflow && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-2 text-[13px] font-medium text-primary hover:underline self-start cursor-pointer block"
            >
              {isExpanded ? "Arată mai puțin" : "Arată tot"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
