<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

# LingoFox — engineering rules

- Course content lives in src/lib/lessons.ts and user progress in src/lib/progress-store.ts; keep UI reading only through these so storage can change without touching screens.
- UI text goes through src/lib/i18n.ts (Arabic default, RTL; English switch); never hardcode user-facing strings in components, so both languages stay in sync.
- Courses live in COURSES in src/lib/lessons.ts; lesson ids are "<courseId>-<unit>-<n>" so completion, achievements and the per-course path all derive from the id prefix.
- Sign-in is Lovable Cloud auth (email/password + managed Google via src/integrations/lovable in SocialButtons); phone shells hide Google because Google blocks WebView sign-in.
- Signed-in progress syncs through src/lib/account.ts (single auth listener, merge on sign-in, debounced upsert to user_progress + xp/streak on profiles); keep it the only auth subscriber.
- Ads are configured only in src/lib/ads-config.ts (public AdSense IDs); AdBanner shows a placeholder while IDs are empty, so placements can ship before approval.
- Phone install is manifest-only (public/manifest.webmanifest + icons, head tags in __root.tsx); no service worker, so previews never serve stale caches.
- Android and iOS apps are Capacitor shells (android/, ios/, capacitor.config.ts) that load the published site; the URL lives only in capacitor-www/app-url.js, and native-only UI tweaks go through src/lib/native.ts, so store users get web updates without a new release.
- Questions are tracked by stable keys "<unitId>:<position>" (findLesson().keys); wrong answers feed spaced repetition in src/lib/review.ts. Practice sessions reuse Quiz via its `practice` prop.
- Account deletion runs only server-side (src/lib/account.functions.ts, identifies the user from the bearer token) and explicitly erases user_id tables; tables keyed to profiles cascade. Any new per-user table must be covered by one of the two.
- Streak maths (incl. freezes) lives in src/lib/streak.ts; freezes are spent lazily when the learner returns, never by a background job.
- Non-Arabic/English courses are built from shared builders in src/lib/course-kit.ts, one file per language in src/lib/courses/; add a language there and to COURSE_IDS, so tests and the picker pick it up.
- Leagues: clients only upsert their own weekly_xp; league membership/friend codes are server-owned (trigger-protected) and promotion runs in rollover_leagues() on a Monday pg_cron job, so users cannot change their league.
- Stories live in src/lib/stories.ts (ids "<courseId>-story-<n>"); read stories are stored separately from completed lessons, so lesson paths and achievements are unaffected.
- AI calls run only in server routes src/routes/api/tutor.ts, src/routes/api/explain.ts (Ask Fox) and src/routes/api/speak.ts; each verifies the bearer token and spends a daily quota via consume_ai_quota before calling the model, to cap cost per user.
- All model access goes through src/lib/server/ai.server.ts: Gemini when GEMINI_API_KEY is set (self-hosted copies), otherwise ai-gateway.server.ts (Lovable AI Gateway, hosted build), so features never call a provider directly.
- Ask Fox sends only the question key; the server rebuilds the exercise with findQuestion (src/lib/explain.ts), so prompts never trust client-sent question text.
- Navigation is BottomNav: a bottom tab bar on phones and a side rail on wide screens (AppPage pads for it), so every app page uses AppPage + BottomNav.
- Visual identity lives only in src/styles.css tokens/utilities (bg-ember, bg-pine, bg-gold, glass, shadow-soft) and ChunkyButton variants; components use those names, never raw colors, so the brand can be retuned in one file.
- Database schema is applied through Lovable migrations; docs/self-host-setup.sql mirrors it for self-hosted copies and must be updated when the schema changes.

