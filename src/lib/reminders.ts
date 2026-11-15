// Daily practice reminder: native local notification in Capacitor apps, or Web Notification in PWA/browsers.
import { isNativeApp } from "./native";

const KEY = "lingofox-reminder";
const ID = 1;
export const REMINDER_HOUR = 20;

export const reminderEnabled = () => typeof window !== "undefined" && localStorage.getItem(KEY) === "on";

export const remindersSupported = () => {
  if (typeof window === "undefined") return false;
  return isNativeApp() || "Notification" in window;
};

/** Returns "on", "off" or "denied". */
export async function setDailyReminder(on: boolean, title: string, body: string): Promise<"on" | "off" | "denied"> {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: [{ id: ID }] }).catch(() => undefined);
      if (!on) {
        localStorage.setItem(KEY, "off");
        return "off";
      }
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") return "denied";
      await LocalNotifications.schedule({
        notifications: [{ id: ID, title, body, schedule: { on: { hour: REMINDER_HOUR, minute: 0 }, allowWhileIdle: true } }],
      });
      localStorage.setItem(KEY, "on");
      return "on";
    } catch {
      return "denied";
    }
  }

  // Web / PWA browser notification support
  if (typeof window !== "undefined" && "Notification" in window) {
    if (!on) {
      localStorage.setItem(KEY, "off");
      return "off";
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return "denied";
      localStorage.setItem(KEY, "on");
      // Trigger confirmation notification
      try {
        new Notification(title, { body, icon: "/fox.png" });
      } catch {
        /* ignore */
      }
      return "on";
    } catch {
      return "denied";
    }
  }

  return "off";
}
