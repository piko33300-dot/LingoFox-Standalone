// Daily practice reminder, only inside the phone apps (local notification, no server needed).
import { isNativeApp } from "./native";

const KEY = "lingofox-reminder";
const ID = 1;
export const REMINDER_HOUR = 20;

export const reminderEnabled = () => typeof window !== "undefined" && localStorage.getItem(KEY) === "on";

/** Returns "on", "off" or "denied". */
export async function setDailyReminder(on: boolean, title: string, body: string): Promise<"on" | "off" | "denied"> {
  if (!isNativeApp()) return "off";
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
}
