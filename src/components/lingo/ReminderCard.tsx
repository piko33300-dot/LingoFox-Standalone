import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { reminderEnabled, remindersSupported, setDailyReminder } from "@/lib/reminders";
import { Switch } from "@/components/ui/switch";

/** Daily reminder switch: supported on Android / iPhone native apps and desktop/mobile PWA. */
export function ReminderCard() {
  const { t } = useT();
  const supported = remindersSupported();
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(reminderEnabled()); }, []);
  if (!supported) return null;

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
