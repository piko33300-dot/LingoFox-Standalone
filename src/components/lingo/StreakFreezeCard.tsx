import { Snowflake } from "lucide-react";
import { toast } from "sonner";
import { progressActions, type Progress } from "@/lib/progress-store";
import { FREEZE_COST, MAX_FREEZES } from "@/lib/streak";
import { useT } from "@/lib/i18n";

/** Shop card: spend gems on streak freezes (spent automatically, one per missed day). */
export function StreakFreezeCard({ p }: { p: Progress }) {
  const { t } = useT();
  const full = p.freezes >= MAX_FREEZES;
  const poor = p.gems < FREEZE_COST;
  const label = full ? t("freezeMax") : poor ? t("freezeNoGems") : t("freezeBuy", { c: FREEZE_COST });

  return (
    <section className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-gem/15 text-gem">
          <Snowflake className="size-6" />
        </span>
        <div className="flex-1">
          <h2 className="font-display font-semibold">{t("freezeTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("freezeDesc")}</p>
          <p className="mt-0.5 text-sm font-semibold text-gem">{t("freezeOwned", { n: p.freezes, m: MAX_FREEZES })}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={full || poor}
        onClick={() => { if (progressActions.buyFreeze()) toast.success(t("freezeBought")); }}
        className="btn-3d mt-3 w-full bg-gem px-4 py-3 text-primary-foreground shadow-[0_4px_0_oklch(0.5_0.15_240)] disabled:opacity-50"
      >
        {label}
      </button>
    </section>
  );
}
