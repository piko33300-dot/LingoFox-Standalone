import { useState, type ReactNode } from "react";
import fox from "@/assets/fox.png";
import { cn } from "@/lib/utils";
import { dirOf, type LangCode } from "@/lib/i18n";
import { Sparkles, Heart } from "lucide-react";

export type FoxMood = "neutral" | "celebrate" | "encourage" | "thinking" | "speaking";
export type FoxSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<FoxSize, { img: string; px: number }> = {
  sm: { img: "size-10", px: 40 },
  md: { img: "size-16 sm:size-20", px: 80 },
  lg: { img: "size-24 sm:size-28", px: 112 },
  xl: { img: "size-40 sm:size-48", px: 192 },
};

interface FoxMascotProps {
  mood?: FoxMood;
  size?: FoxSize;
  speech?: string;
  speechLang?: LangCode;
  hint?: string;
  badge?: string;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function FoxMascot({
  mood = "neutral",
  size = "md",
  speech,
  speechLang,
  hint,
  badge,
  className,
  onClick,
  children,
}: FoxMascotProps) {
  const [tapped, setTapped] = useState(false);
  const dims = SIZE_MAP[size];

  const handleTap = () => {
    setTapped(true);
    setTimeout(() => setTapped(false), 500);
    onClick?.();
  };

  const animationClass =
    mood === "celebrate"
      ? "animate-bounce-celebrate"
      : mood === "encourage"
      ? "animate-encourage-wobble"
      : mood === "thinking"
      ? "animate-pulse"
      : tapped
      ? "scale-110 -rotate-3 transition-transform duration-200"
      : "hover:scale-105 transition-transform duration-200";

  const foxImage = (
    <div
      onClick={handleTap}
      className={cn(
        "relative inline-flex items-center justify-center cursor-pointer select-none",
        animationClass,
        className
      )}
      role="img"
      aria-label="LingoFox Mascot"
    >
      <img
        src={fox}
        alt="LingoFox"
        width={dims.px}
        height={dims.px}
        className={cn(
          dims.img,
          "object-contain drop-shadow-[0_8px_16px_rgba(235,94,40,0.25)] transition-all",
          mood === "celebrate" && "animate-kinetic-glow"
        )}
      />

      {mood === "celebrate" && (
        <span className="pointer-events-none absolute -top-1 -end-1 text-gold animate-bounce">
          <Sparkles className="size-5 fill-gold drop-shadow-md" />
        </span>
      )}

      {mood === "encourage" && (
        <span className="pointer-events-none absolute -bottom-1 -start-1 text-destructive animate-pulse">
          <Heart className="size-4 fill-destructive drop-shadow-sm" />
        </span>
      )}

      {badge && (
        <span className="absolute -bottom-2 whitespace-nowrap rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground shadow-sm ring-1 ring-border">
          {badge}
        </span>
      )}
    </div>
  );

  if (!speech && !children) {
    return foxImage;
  }

  return (
    <div className="flex items-center gap-3">
      {foxImage}
      {speech && (
        <div className="relative rounded-2xl border-2 border-border bg-card px-4 py-2.5 shadow-sm">
          <p
            dir={speechLang ? dirOf(speechLang) : "auto"}
            lang={speechLang}
            className="font-display text-xl font-semibold leading-relaxed"
          >
            {speech}
          </p>
          {hint && <p dir="ltr" className="text-sm italic text-muted-foreground">{hint}</p>}
          {/* Cartoon speech bubble pointer */}
          <span
            aria-hidden
            className="absolute -start-2 top-1/2 -translate-y-1/2 size-3 rotate-45 border-b-2 border-s-2 border-border bg-card"
          />
        </div>
      )}
      {children}
    </div>
  );
}
