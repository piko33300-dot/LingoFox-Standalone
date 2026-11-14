import { readFileSync } from "node:fs";
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android (Google Play) shell for LingoFox.
 *
 * The app opens the published LingoFox website inside a native WebView, so
 * web updates reach phone users without a new store release.
 * The address is read from capacitor-www/app-url.js (single source, also used
 * by the offline screen's Retry button). See ANDROID-BUILD-ar.md.
 */
function readAppUrl(): string {
  // Capacitor commands run from the project root.
  const src = readFileSync("capacitor-www/app-url.js", "utf8");
  const match = src.match(/LINGOFOX_APP_URL\s*=\s*["']([^"']+)["']/);
  if (!match?.[1]) throw new Error("Set LINGOFOX_APP_URL in capacitor-www/app-url.js");
  return match[1];
}

const config: CapacitorConfig = {
  appId: "com.lingofox.app",
  appName: "LingoFox",
  webDir: "capacitor-www",
  server: {
    url: readAppUrl(),
    cleartext: false,
    androidScheme: "https",
    errorPath: "offline.html",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#fdfaf4",
  },
  ios: {
    backgroundColor: "#fdfaf4",
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
