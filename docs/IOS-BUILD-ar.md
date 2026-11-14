# دليل بناء نسخة iPhone ونشرها في App Store — LingoFox

مشروع iPhone جاهز في المجلد `ios/` (الأيقونة وشاشة البداية بالثعلب مُولّدة مسبقاً). التطبيق يفتح موقع LingoFox المنشور داخل تطبيق iOS حقيقي، تماماً مثل نسخة Android، فأي تحديث تنشره يصل فوراً للمستخدمين دون إصدار جديد.

---

## 1) ما تحتاجه

1. **جهاز Mac** (لا يمكن بناء تطبيقات iPhone من Windows أو Linux).
2. **Xcode** أحدث إصدار — مجاناً من Mac App Store.
3. **Node.js 22 أو أحدث** — من https://nodejs.org
4. **حساب Apple Developer** — ‏99 دولاراً سنوياً من https://developer.apple.com/programs
   (للتجربة على هاتفك فقط يكفي حساب Apple مجاني).

---

## 2) ضع رابط موقعك المنشور

افتح `capacitor-www/app-url.js` وضع رابطك (نفس الملف المستخدم لنسخة Android):

```js
window.LINGOFOX_APP_URL = "https://lingofox.app";
```

---

## 3) جهّز المشروع وافتحه في Xcode

في الطرفية داخل مجلد المشروع:

```bash
npm install
npx cap sync ios
npx cap open ios
```

---

## 4) الإعداد داخل Xcode (مرة واحدة)

1. اختر **App** من القائمة اليسرى ← تبويب **Signing & Capabilities**.
2. فعّل **Automatically manage signing** واختر فريقك (Team).
3. تأكد أن **Bundle Identifier** هو `com.lingofox.app` (أو غيّره لمعرّف تملكه، وغيّره أيضاً في `capacitor.config.ts`).
4. وصّل هاتفك واضغط ▶ للتجربة.

---

## 5) الرفع إلى App Store

1. في https://appstoreconnect.apple.com أنشئ تطبيقاً جديداً بنفس الـ Bundle ID.
2. في Xcode: اختر **Any iOS Device (arm64)** ← **Product ▸ Archive**.
3. في نافذة Organizer اضغط **Distribute App ▸ App Store Connect ▸ Upload**.
4. في App Store Connect أكمل: الوصف، لقطات الشاشة (6.7 و 6.5 إنش)، الفئة **Education**، التصنيف العمري، ورابط سياسة الخصوصية: `https://رابطك/privacy`.
5. أرسل للمراجعة.

---

## ملاحظات مهمة لقبول Apple

- **حذف الحساب:** موجود داخل التطبيق (صفحة حسابي) — شرط إلزامي لدى Apple.
- **سياسة الخصوصية:** صفحة `/privacy` موجودة؛ ضع بريد التواصل الحقيقي في `src/lib/legal.ts`.
- **تسجيل الدخول:** داخل التطبيق يظهر البريد وكلمة المرور فقط (أزرار Google مخفية)، لذلك لا تشترط Apple إضافة «Sign in with Apple».
- **الإعلانات:** إعلانات AdSense مخفية داخل التطبيق. للربح داخل iPhone استخدم AdMob لاحقاً (يحتاج معرّفات AdMob الخاصة بك).
- **القيمة الأصلية للتطبيق (القاعدة 4.2):** Apple ترفض أحياناً التطبيقات التي تبدو «موقعاً داخل غلاف». ميزات مثل الدروس التفاعلية والنطق والإنجازات تساعد على القبول؛ في ملاحظات المراجعة اشرح أنه تطبيق تعليمي تفاعلي بحسابات وتقدّم محفوظ.
