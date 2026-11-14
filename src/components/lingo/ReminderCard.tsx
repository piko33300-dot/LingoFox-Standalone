import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useIsNativeApp } from "@/lib/native";
import { reminderEnabled, setDailyReminder } from "@/lib/reminders";
import { Switch } from "@/components/ui/switch";

/** Daily reminder switch; only shown inside the Android / iPhone apps. */
export function ReminderCard() {
  const { t } = useT();
  const native = useIsNativeApp();
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(reminderEnabled()); }, []);
  if (!native) return null;

  async function toggle(next: boolean) {
    try {
      const res = await setDailyReminder(next, "LingoFox 🦊", t("reminderBody"));
      setOn(res === "on");
      if (res === "denied") toast.error(t("reminderDenied"));
      else toast.success(res === "on" ? t("reminderOn") : t("reminderOff"));
    } catch {
      toast.error(t("reminderDenied"));
    }
  }

  return (
    <section className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4">
      <span className="flex size-11 items-center justify-center rounded-full bg-flame/15 text-flame"><Bell className="size-6" /></span>
      <div className="flex-1">
        <h2 className="font-bold text-secondary">{t("reminderTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("reminderDesc")}</p>
      </div>
      <Switch checked={on} onCheckedChange={(v) => void toggle(v)} aria-label={t("reminderTitle")} />
    </section>
  );
}
