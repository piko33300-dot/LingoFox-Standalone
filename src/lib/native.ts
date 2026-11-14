import { useEffect, useState } from "react";

/**
 * Detects the LingoFox Android app (Capacitor shell that loads this website).
 * The native bridge injects window.Capacitor; regular browsers never have it.
 */
type CapacitorGlobal = { isNativePlatform?: () => boolean };

let cached: boolean | undefined;
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  if (cached === undefined) {
    const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
    cached = cap?.isNativePlatform?.() === true;
  }
  return cached;
}

/** Hydration-safe flag: false on the server and first render, then the real value. */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => { setNative(isNativeApp()); }, []);
  return native;
}

let started = false;
/** Android hardware back button: go back inside the app, exit on the first screen. */
export async function startNativeApp(): Promise<void> {
  if (started || !isNativeApp()) return;
  started = true;
  document.documentElement.classList.add("native-app");
  try {
    const { App } = await import("@capacitor/app");
    await App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void App.exitApp();
    });
  } catch (err) {
    console.warn("Native back button unavailable", err);
  }
}
