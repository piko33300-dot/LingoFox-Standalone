import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lingofox.app",
  appName: "LingoFox",
  // TanStack Start SPA build emits its shell and static assets here.
  webDir: "dist/client",
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
