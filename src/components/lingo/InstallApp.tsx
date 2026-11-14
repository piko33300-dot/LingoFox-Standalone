import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useIsNativeApp } from "@/lib/native";
import { ChunkyButton } from "@/components/lingo/ChunkyButton";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Home-screen install card: one-tap install where the browser supports it, otherwise per-platform steps. */
export function InstallApp() {
  const { t } = useT();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "other">("other");
  const native = useIsNativeApp();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setPlatform(/iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "other");
    const onPrompt = (e: Event) => { e.preventDefault(); setPromptEvent(e as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Inside the Android app it is already installed; nothing to show.
  if (native) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <section className="rounded-2xl border-2 border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
        <Smartphone className="size-5 text-primary" />{t("installTitle")}
      </h2>
      {installed ? (
        <p className="mt-2 font-semibold text-success">{t("installed")}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{t("installBody")}</p>
          {promptEvent && (
            <ChunkyButton className="mt-3 w-full" onClick={install}>{t("installButton")}</ChunkyButton>
          )}
          <ul className="mt-3 space-y-2 text-sm">
            {platform === "ios" ? (
              <li>{t("installIos")}</li>
            ) : (
              <>
                <li>{t("installAndroid")}</li>
                <li>{t("installIos")}</li>
              </>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
