# LingoFox 🦊

Premium language-learning app (Arabic-first, RTL + English UI): 6 courses, bite-size lessons,
stories, AI tutor chat, "Ask Fox" explanations inside every lesson, speaking practice with AI
scoring, weekly leagues, friends, streaks, achievements, ads, and Android / iPhone shells.

## Run locally

```sh
bun install
bun run dev        # http://localhost:8080
bun run test       # unit tests
bun run build      # production build
```

## Hosted on Lovable (default)
- Database + sign-in: Lovable Cloud (schema in `drizzle/migrations/`).
- AI tutor, Ask Fox, speech transcription: Lovable AI Gateway (no key needed).

## Self-hosting this ZIP
1. Create your own Supabase project and run `docs/self-host-setup.sql` once.
2. `cp .env.example .env` and fill in your values (never commit `.env`).
3. Set `GEMINI_API_KEY` on the server — the app then calls Google Gemini directly.
4. Google sign-in in this copy uses Lovable's managed Google; when self-hosting, enable Google in
   your Supabase Auth providers and switch `src/components/lingo/SocialButtons.tsx` to
   `supabase.auth.signInWithOAuth`.

## Phone apps
Android/iOS are Capacitor shells that load the published site. Put your published address in
`capacitor-www/app-url.js`, then follow `docs/ANDROID-BUILD-ar.md` and `docs/IOS-BUILD-ar.md`.
Store publishing: `docs/PUBLISH-GUIDE-ar.md`.

## Stack
TanStack Start (React 19, SSR) · Vite · Tailwind CSS v4 · Lovable Cloud (auth + Postgres) ·
Lovable AI / Google Gemini · Capacitor (Android / iOS).
