// Google AdSense settings. These IDs are public (they appear in every page's HTML).
// Fill `client` with your publisher ID (e.g. "ca-pub-1234567890123456") and the
// slot IDs from AdSense → Ads → By ad unit. Leave empty to show placeholders.
export const ADS = {
  client: "",
  slots: {
    learnBanner: "",
    lessonComplete: "",
    rewarded: "",
  },
} as const;

export type AdSlotName = keyof typeof ADS.slots;
export const adsEnabled = () => ADS.client.length > 0;

/** Seconds a learner must keep the rewarded ad open before claiming hearts. */
export const REWARDED_AD_SECONDS = 5;
