import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  name?: string | null;
  className?: string;
}

export default function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  let initials: string | null = null;

  if (name) {
    const trimmed = name.trim();
    if (trimmed) {
      const tokens = trimmed.split(/\s+/);
      const letterRegex = /\p{L}/u;
      const step1 = tokens.filter((token) => {
        const firstChar = Array.from(token)[0];
        return firstChar ? letterRegex.test(firstChar) : false;
      });
      const step2 = step1
        .map((token) => token.replace(/[^\p{L}]/gu, ""))
        .filter((token) => token.length > 0);

      if (step2.length === 1) {
        initials = Array.from(step2[0]).slice(0, 2).join("").toUpperCase();
      } else if (step2.length >= 2) {
        const firstChar = Array.from(step2[0])[0] || "";
        const secondChar = Array.from(step2[1])[0] || "";
        initials = (firstChar + secondChar).toUpperCase();
      }
    }
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold flex-shrink-0 w-9 h-9 text-sm",
        className
      )}
    >
      {initials ? initials : <User className="h-4 w-4" />}
    </div>
  );
}
