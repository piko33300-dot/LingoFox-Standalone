# تشغيل LingoFox مستقلاً تماماً

هذه النسخة لا تعتمد على Lovable إطلاقاً: قاعدة البيانات وتسجيل الدخول من مشروع Supabase الخاص بك،
والذكاء الاصطناعي (المعلّم، «اسأل فوكس»، تقييم النطق) من Google Gemini بمفتاحك، والخادم على استضافتك.

## ما تحتاجه
- حاسوب عليه [Bun](https://bun.sh) أو Node.js 22+.
- حساب مجاني في [Supabase](https://supabase.com) (قاعدة بيانات + تسجيل دخول).
- مفتاح Gemini من [Google AI Studio](https://aistudio.google.com/apikey).

## الخطوات
1. **قاعدة البيانات:** أنشئ مشروعاً في Supabase ← SQL Editor ← الصق محتوى `supabase/setup.sql` ← Run (مرة واحدة فقط).
   ينشئ الجداول، وقواعد الحماية، وحدود الاستخدام اليومية، والتحديث الأسبوعي للدوريات.
2. **تسجيل الدخول:** Supabase ← Authentication ← Providers: فعّل Email، وفعّل Google (يحتاج Client ID/Secret من Google Cloud Console).
   ثم Authentication ← URL Configuration: ضع رابط موقعك في Site URL وأضف `https://رابطك/auth` و`https://رابطك/reset-password` في Redirect URLs.
3. **المفاتيح:** انسخ `.env.example` إلى `.env` واملأ القيم (القائمة بالأسفل). لا ترفع `.env` إلى GitHub (محمي في `.gitignore`).
4. **التشغيل على حاسوبك:** `bun install` ثم `bun run dev` وافتح http://localhost:8080
5. **الاختبارات:** `bun run test`
6. **النشر:**
   - خادم عادي (VPS): `NITRO_PRESET=node-server bun run build` ثم `node .output/server/index.mjs` (يستمع على المنفذ `PORT`، الافتراضي 3000). ضعه خلف Nginx مع HTTPS.
   - Vercel / Netlify / Cloudflare: ارفع المستودع واضبط `NITRO_PRESET` على `vercel` أو `netlify` أو `cloudflare-module`، وضع متغيرات `.env` في إعدادات الاستضافة.

## المفاتيح المطلوبة (الأسماء فقط)
| الاسم | أين يُستخدم | سري؟ |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | المتصفح | لا (عامة) |
| `VITE_AUTH_MODE=supabase` | زر Google | لا |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | الخادم | لا |
| `SUPABASE_SERVICE_ROLE_KEY` | الخادم فقط (حذف الحساب) | **نعم** |
| `GEMINI_API_KEY` | الخادم فقط (المعلّم، اسأل فوكس، النطق) | **نعم** |
| `GEMINI_MODEL` (اختياري) | اسم نموذج Gemini | لا |

## حدود الاستخدام اليومية لكل متعلّم (لحماية تكلفة الذكاء الاصطناعي)
40 رسالة للمعلّم، 60 شرحاً من «اسأل فوكس»، 60 محاولة نطق. غيّرها في الدالة `consume_ai_quota` داخل `supabase/setup.sql`.

## GitHub Actions
`.github/workflows/build.yml` يشغّل الاختبارات والبناء عند كل رفع. أضف في GitHub ← Settings ← Secrets:
`VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` و`VITE_SUPABASE_PROJECT_ID`.

## تطبيقات الجوال
ضع رابط موقعك المنشور في `capacitor-www/app-url.js` ثم اتبع `PUBLISH-GUIDE-ar.md` و`ANDROID-BUILD-ar.md` و`IOS-BUILD-ar.md`.
