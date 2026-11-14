import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { REWARDED_AD_SECONDS } from "@/lib/ads-config";
import { useT } from "@/lib/i18n";
import { AdBanner } from "./AdBanner";
import { ChunkyButton } from "./ChunkyButton";

/** Full-screen ad the learner keeps open for a few seconds to earn a heart refill. */
export function RewardedAd({ onReward, onClose }: { onReward: () => void; onClose: () => void }) {
  const { t } = useT();
  const [left, setLeft] = useState(REWARDED_AD_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-secondary/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-pop rounded-3xl bg-card p-5 text-center">
        <h2 className="text-2xl font-bold text-secondary">{t("rewardTitle")}</h2>
        <AdBanner slot="rewarded" className="mt-4 min-h-[250px]" />
        <p className="mt-4 font-display text-muted-foreground" aria-live="polite">
          {left > 0 ? t("rewardWait", { n: left }) : "✅"}
        </p>
        <div className="mt-4 space-y-3">
          <ChunkyButton variant="success" disabled={left > 0} onClick={onReward} className="flex items-center justify-center gap-2">
            <Heart className="size-5 fill-primary-foreground" /> {t("claimReward")}
          </ChunkyButton>
          <ChunkyButton variant="outline" onClick={onClose}>{t("close")}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}
