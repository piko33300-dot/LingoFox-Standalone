-- LingoFox Idempotent Database Setup (Safe to re-run anytime)

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Fox learner',
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add league and friend_code if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='league') THEN
    ALTER TABLE public.profiles ADD COLUMN league smallint NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='friend_code') THEN
    ALTER TABLE public.profiles ADD COLUMN friend_code text NOT NULL DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_friend_code_idx ON public.profiles (friend_code);
CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp DESC);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can view leaderboard profiles" ON public.profiles;
CREATE POLICY "Signed-in users can view leaderboard profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own progress" ON public.user_progress;
CREATE POLICY "Users read own progress" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own progress" ON public.user_progress;
CREATE POLICY "Users insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;
CREATE POLICY "Users update own progress" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Functions and Triggers for updated_at & user creation
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS progress_touch ON public.user_progress;
CREATE TRIGGER progress_touch BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(COALESCE(NEW.email, 'fox'), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Protect profile fields trigger
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.league := OLD.league;
    NEW.friend_code := OLD.friend_code;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_protect ON public.profiles;
CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 4. Tutor Messages
CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  course text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.tutor_messages TO authenticated;
GRANT ALL ON public.tutor_messages TO service_role;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own tutor messages" ON public.tutor_messages;
CREATE POLICY "Users read own tutor messages" ON public.tutor_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users add own tutor messages" ON public.tutor_messages;
CREATE POLICY "Users add own tutor messages" ON public.tutor_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users clear own tutor messages" ON public.tutor_messages;
CREATE POLICY "Users clear own tutor messages" ON public.tutor_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tutor_messages_user_time_idx ON public.tutor_messages (user_id, created_at);

-- 5. AI Usage
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  kind text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, kind)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ai usage" ON public.ai_usage;
CREATE POLICY "Users read own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_ai_quota(_kind text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _limit integer;
  _count integer;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  _limit := CASE _kind WHEN 'tutor' THEN 40 WHEN 'speak' THEN 60 WHEN 'explain' THEN 60 ELSE 0 END;
  IF _limit = 0 THEN RETURN false; END IF;
  INSERT INTO public.ai_usage (user_id, day, kind, count)
  VALUES (_uid, (now() AT TIME ZONE 'utc')::date, _kind, 1)
  ON CONFLICT (user_id, day, kind) DO UPDATE SET count = public.ai_usage.count + 1
  RETURNING count INTO _count;
  RETURN _count <= _limit;
END; $$;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text) TO authenticated;

-- 6. Weekly XP
CREATE TABLE IF NOT EXISTS public.weekly_xp (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  league smallint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE ON public.weekly_xp TO authenticated;
GRANT ALL ON public.weekly_xp TO service_role;
ALTER TABLE public.weekly_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users view league tables" ON public.weekly_xp;
CREATE POLICY "Signed-in users view league tables" ON public.weekly_xp FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own weekly xp" ON public.weekly_xp;
CREATE POLICY "Users insert own weekly xp" ON public.weekly_xp FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own weekly xp" ON public.weekly_xp;
CREATE POLICY "Users update own weekly xp" ON public.weekly_xp FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS weekly_xp_board_idx ON public.weekly_xp (week_start, league, xp DESC);

CREATE OR REPLACE FUNCTION public.weekly_xp_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.week_start := date_trunc('week', now() AT TIME ZONE 'utc')::date;
  NEW.xp := GREATEST(0, LEAST(NEW.xp, 20000));
  NEW.league := COALESCE((SELECT league FROM public.profiles WHERE id = NEW.user_id), 0);
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' AND OLD.week_start <> NEW.week_start THEN
    RAISE EXCEPTION 'past weeks are closed';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS weekly_xp_guard ON public.weekly_xp;
CREATE TRIGGER weekly_xp_guard BEFORE INSERT OR UPDATE ON public.weekly_xp FOR EACH ROW EXECUTE FUNCTION public.weekly_xp_guard();

-- Weekly promotion / demotion (run every Monday)
CREATE OR REPLACE FUNCTION public.rollover_leagues()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _last date := date_trunc('week', (now() AT TIME ZONE 'utc') - interval '7 days')::date;
BEGIN
  WITH ranked AS (
    SELECT user_id, league, xp,
      row_number() OVER (PARTITION BY league ORDER BY xp DESC) AS pos,
      count(*) OVER (PARTITION BY league) AS total
    FROM public.weekly_xp WHERE week_start = _last
  ), moves AS (
    SELECT user_id,
      CASE
        WHEN pos <= 10 AND xp > 0 AND league < 4 THEN league + 1
        WHEN total > 10 AND pos > total - 5 AND league > 0 THEN league - 1
        ELSE league
      END AS next_league
    FROM ranked
  )
  UPDATE public.profiles p SET league = m.next_league
  FROM moves m WHERE p.id = m.user_id AND p.league <> m.next_league;

  UPDATE public.profiles p SET league = p.league - 1
  WHERE p.league > 0
    AND NOT EXISTS (SELECT 1 FROM public.weekly_xp w WHERE w.user_id = p.id AND w.week_start = _last);
END; $$;
REVOKE EXECUTE ON FUNCTION public.rollover_leagues() FROM PUBLIC, anon, authenticated;

-- 7. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their follows" ON public.follows;
CREATE POLICY "Users see their follows" ON public.follows FOR SELECT TO authenticated USING (auth.uid() = follower_id OR auth.uid() = followee_id);

DROP POLICY IF EXISTS "Users follow others" ON public.follows;
CREATE POLICY "Users follow others" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users unfollow" ON public.follows;
CREATE POLICY "Users unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 8. Cron Schedule (safely unschedule if exists, then schedule)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rollover-leagues') THEN
    PERFORM cron.unschedule('rollover-leagues');
  END IF;
  PERFORM cron.schedule('rollover-leagues', '10 0 * * 1', 'SELECT public.rollover_leagues();');
EXCEPTION WHEN OTHERS THEN
  -- pg_cron might not be enabled or permission restricted on some plans
  RAISE NOTICE 'pg_cron setup skipped or not available';
END $$;
