import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";
import { ADS, adsEnabled, type AdSlotName } from "@/lib/ads-config";
import { useT } from "@/lib/i18n";
import { isNativeApp, useIsNativeApp } from "@/lib/native";
import { cn } from "@/lib/utils";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

let scriptAdded = false;
function ensureAdScript() {
  if (scriptAdded || typeof document === "undefined") return;
  scriptAdded = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`;
  document.head.appendChild(s);
}

/** Responsive Google AdSense unit, or a labelled placeholder until AdSense is set up. */
export function AdBanner({ slot, className }: { slot: AdSlotName; className?: string }) {
  const { t } = useT();
  const ref = useRef<HTMLModElement>(null);
  const slotId = ADS.slots[slot];
  // Web ads (AdSense) are not allowed inside store apps; the Android app needs AdMob instead.
  const native = useIsNativeApp();
  const live = adsEnabled() && slotId.length > 0 && !native;

  useEffect(() => {
    if (!live || isNativeApp()) return;
    ensureAdScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ad blocked or not ready */
    }
  }, [live]);

  if (native) return null;

  return (
    <aside aria-label={t("sponsored")} className={cn("overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card", className)}>
      <p className="px-3 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("sponsored")}</p>
      {live ? (
        <ins
          ref={ref}
          className="adsbygoogle block min-h-[90px]"
          data-ad-client={ADS.client}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex min-h-[90px] items-center justify-center gap-2 px-4 pb-3 text-center text-sm text-muted-foreground">
          <Megaphone className="size-5 shrink-0" />
          {t("adPlaceholder")}
        </div>
      )}
    </aside>
  );
}
