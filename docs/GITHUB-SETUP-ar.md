# تشغيل LingoFox من مستودع GitHub مستقل

هذه النسخة كاملة: الموقع + تطبيق أندرويد (android/) + تطبيق آيفون (ios/) + إعداد قاعدة البيانات.
لا تحتوي على كلمات سر أو مفاتيح؛ ستضع مفاتيحك أنت.

## 1) رفع الملفات إلى GitHub
1. فك ضغط الملف على حاسوبك.
2. أنشئ مستودعاً جديداً **خاصاً (Private)** في github.com.
3. من مجلد المشروع:
```bash
git init
git add .
git commit -m "LingoFox"
git branch -M main
git remote add origin https://github.com/اسمك/lingofox.git
git push -u origin main
```

## 2) قاعدة البيانات والحسابات (Supabase)
1. أنشئ مشروعاً مجانياً في supabase.com.
2. افتح **SQL Editor** والصق محتوى الملف `supabase/setup.sql` كاملاً ثم اضغط Run.
   (ينشئ الجداول والصلاحيات وجدول الدوري الأسبوعي.)
3. من **Project Settings ← API** انسخ: رابط المشروع، المفتاح العام (anon/publishable)، ومفتاح service_role (سري).
4. تسجيل Google: **Authentication ← Providers ← Google** وأدخل بيانات Google Cloud الخاصة بك،
   وأضف رابط موقعك في **Authentication ← URL Configuration**.

## 3) ملف الإعدادات
انسخ `.env.example` إلى `.env` واملأ القيم. اجعل `VITE_AUTH_MODE=supabase` (يجعل Google يعمل مباشرة عبر مشروعك).
لا ترفع ملف `.env` إلى GitHub (موجود في .gitignore).

## 4) التشغيل على حاسوبك
```bash
npm install      # أو bun install
npm run dev      # يفتح على http://localhost:8080
npm test         # تشغيل الاختبارات
```

## 5) الاستضافة (اختر واحدة)
المشروع مُعد للعمل على **Cloudflare Workers** (`npm run build` ثم `npx wrangler deploy`)،
ويمكن أيضاً ربط المستودع بخدمات مثل Cloudflare Pages/Netlify/Vercel. ضع كل المتغيرات من `.env.example` في إعدادات بيئة الاستضافة.

## 6) المعلّم الذكي وتدريب النطق
يعملان (مع «اسأل فوكس») عبر Google Gemini ويحتاجان المتغير `GEMINI_API_KEY` على الخادم (من https://aistudio.google.com/apikey).
بدون المفتاح يعمل باقي التطبيق كاملاً، وتظهر رسالة خطأ في هاتين الشاشتين فقط.
يمكن لاحقاً استبدالها بمزود آخر (مثل OpenAI) بتعديل ملف واحد: `src/lib/server/ai.server.ts`.

## 7) تطبيقات المتاجر
بعد نشر الموقع ضع رابطه في `capacitor-www/app-url.js`، ثم اتبع:
- `ANDROID-BUILD-ar.md` لـ Google Play
- `IOS-BUILD-ar.md` لـ App Store (يحتاج جهاز Mac)
- `PUBLISH-GUIDE-ar.md` للدليل الشامل (الإعلانات والتحديثات)
