# LingoFox Engineering Master Handoff & V1.0 Architecture Specification

## 1. System Overview
- **Product Name:** LingoFox (ثعلب اللغات)
- **Repo URL:** `https://github.com/piko33300-dot/LingoFox-Standalone.git`
- **Framework:** TanStack Start (SSR/Vite) with React 19, TypeScript & Tailwind CSS v4.
- **Design System:** Ember Kinetic (Warm Amber / Forest Pine palette) with interactive 3D Fox Mascot (`FoxMascot.tsx`).
- **Direction & Typography:** Full bidirectional RTL (Arabic - Readex Pro / IBM Plex Sans) and LTR (Latin - Plus Jakarta Sans).
- **Backend & Database:** Supabase with schema defined in `supabase/setup.sql` (profiles, weekly_xp, follows, tutor_messages, custom courses/lessons).
- **Audio & Haptics:** Custom polyphonic Web Audio API synthesis engine (`src/lib/sound.ts`) with mobile haptic feedback.
- **AI Engine:** Google Gemini API direct integration (`src/lib/server/ai.server.ts`), fully decoupled for self-hosting.
- **Mobile Foundation:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/local-notifications`).

---

## 2. Environment Variables (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Configuration (Direct Google Gemini - 100% Free Tier Available)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TRANSCRIBE_MODEL=gemini-1.5-flash

# Auth Mode (set to supabase for pure independent OAuth & email)
VITE_AUTH_MODE=supabase

# Port (for local / Docker / VPS hosting)
PORT=3000
```

---

## 3. Key Components & Architecture Map
- `src/components/lingo/FoxMascot.tsx`: Interactive SVG/CSS 3D Fox Mascot with mood states (neutral, celebrate, encourage, thinking, speaking).
- `src/lib/sound.ts`: High-fidelity synthesizer (correct, wrong, complete, streak, tap) + mobile vibration.
- `src/lib/progress-store.ts`: Game economy store (XP, gems, hearts, streak freezes, auto-regeneration of 1 heart / 4 hours, practice recovery).
- `src/lib/reminders.ts`: Daily 8:00 PM practice reminders supporting native Capacitor notifications & Web/PWA Notifications.
- `src/lib/speech.ts` & `src/lib/speech-recognition.ts`: Browser Web Speech API detection with audio recording fallback via `MediaRecorder`.
- `src/routes/api/`: Server endpoints for `tutor.ts` (streaming dialogue), `speak.ts` (voice pronunciation), and `explain.ts` (error explanation).

---

## 4. Development & Build Commands
```bash
npm install        # Install all dependencies
npm run dev        # Start TanStack Start development server
npm test           # Run 200+ Vitest unit & integration tests
npm run build      # Compile production client & SSR server
```

---

## 5. Mobile Build Steps (Android & iOS)
```bash
# Add platforms
npx cap add android
npx cap add ios

# Sync web assets to native projects
npm run build
npx cap sync

# Open in Android Studio or Xcode
npx cap open android
npx cap open ios
```
