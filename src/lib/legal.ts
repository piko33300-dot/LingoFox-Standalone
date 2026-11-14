import type { Localized } from "./lessons";

/** Owner-supplied details shown on the privacy page. Fill these in before publishing to Google Play. */
export const CONTACT_EMAIL = ""; // e.g. "support@yourdomain.com" — the page shows a contact line only when set
export const POLICY_UPDATED = "2026-11-07";

export type PolicySection = { title: Localized; body: Localized[] };

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    title: { ar: "ما الذي نجمعه", en: "What we collect" },
    body: [
      {
        ar: "إن أنشأت حساباً: بريدك الإلكتروني واسمك الظاهر وتقدمك في التعلّم (النقاط والتتابع والدروس المكتملة والكلمات التي تحتاج مراجعة).",
        en: "If you create an account: your email, display name and learning progress (XP, streak, completed lessons and items due for review).",
      },
      {
        ar: "إن استخدمت التطبيق كضيف: يُحفظ تقدمك على جهازك فقط ولا نستلم منه شيئاً.",
        en: "If you use the app as a guest: your progress is stored on your device only and we receive nothing from it.",
      },
      {
        ar: "المعلّم الذكي: تُحفظ رسائلك مع «فوكس» في حسابك حتى تحذفها بزر «محادثة جديدة»، وتُرسل إلى مزوّد ذكاء اصطناعي لإنشاء الرد.",
        en: "AI tutor: your messages with Fox are saved to your account until you clear them with “New chat”, and are sent to an AI provider to generate replies.",
      },
      {
        ar: "تدريب النطق: يُرسل تسجيل صوتك إلى مزوّد ذكاء اصطناعي لتحويله إلى نص وتقييمه، ولا نحتفظ بالتسجيل بعد ذلك.",
        en: "Speaking practice: your voice recording is sent to an AI provider to transcribe and score it; we do not keep the recording afterwards.",
      },
      {
        ar: "الدوريات والأصدقاء: نحفظ نقاطك الأسبوعية ودوريّك وقائمة الأصدقاء الذين أضفتهم برمز الصداقة.",
        en: "Leagues and friends: we store your weekly XP, your league and the friends you added with a friend code.",
      },
    ],
  },
  {
    title: { ar: "كيف نستخدمها", en: "How we use it" },
    body: [
      {
        ar: "نستخدم بياناتك لتشغيل التطبيق: تسجيل الدخول، وحفظ تقدمك على كل أجهزتك، وعرض لوحة المتصدرين. يظهر اسمك الظاهر ونقاطك للمستخدمين المسجّلين الآخرين في لوحة المتصدرين. لا نبيع بياناتك.",
        en: "We use your data to run the app: sign-in, saving your progress across devices and showing the leaderboard. Your display name and XP are visible to other signed-in users on the leaderboard. We do not sell your data.",
      },
    ],
  },
  {
    title: { ar: "الإعلانات", en: "Advertising" },
    body: [
      {
        ar: "قد يعرض التطبيق إعلانات عبر Google AdSense أو AdMob. قد تستخدم هذه الخدمات ملفات تعريف الارتباط أو معرّف الإعلانات في جهازك لعرض إعلانات مناسبة، وتخضع لسياسات Google.",
        en: "The app may show ads through Google AdSense or AdMob. These services may use cookies or your device advertising ID to show relevant ads and are governed by Google's policies.",
      },
    ],
  },
  {
    title: { ar: "أين تُحفظ البيانات", en: "Where data is stored" },
    body: [
      {
        ar: "تُحفظ بيانات الحساب والتقدم في خدمة سحابية آمنة مع ضوابط وصول تمنع المستخدمين من قراءة تقدّم بعضهم.",
        en: "Account and progress data is stored in a secure cloud service with access rules that stop users from reading each other's progress.",
      },
    ],
  },
  {
    title: { ar: "حذف حسابك وبياناتك", en: "Deleting your account and data" },
    body: [
      {
        ar: "يمكنك حذف حسابك في أي وقت من صفحة «حسابي» ← «حذف الحساب». يؤدي ذلك إلى حذف بريدك واسمك وكل تقدمك نهائياً من خوادمنا.",
        en: "You can delete your account any time from Profile → Delete account. This permanently erases your email, name and all progress from our servers.",
      },
    ],
  },
  {
    title: { ar: "الأطفال", en: "Children" },
    body: [
      {
        ar: "التطبيق غير موجّه للأطفال دون 13 عاماً، ولا نجمع بياناتهم عن قصد.",
        en: "The app is not directed at children under 13 and we do not knowingly collect their data.",
      },
    ],
  },
];
