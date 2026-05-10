-- ============================================================
-- PROCTORING / LIVE MONITORING SYSTEM
-- ============================================================

-- 1. Add proctoring configuration columns to tests table
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS proctoring_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_require_camera boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_require_mic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_require_screen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_snapshot_interval integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS proctoring_allowlist_only boolean NOT NULL DEFAULT false;

-- 2. Allowlist: specific users permitted to be monitored for a test
CREATE TABLE IF NOT EXISTS public.proctoring_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_id, user_id)
);

ALTER TABLE public.proctoring_allowlist ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_proct_allowlist_test ON public.proctoring_allowlist(test_id);
CREATE INDEX IF NOT EXISTS idx_proct_allowlist_user ON public.proctoring_allowlist(user_id);

-- 3. Proctoring sessions — one per test attempt
CREATE TABLE IF NOT EXISTS public.proctoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  test_id uuid NOT NULL,
  user_id uuid NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  camera_enabled boolean DEFAULT false,
  mic_enabled boolean DEFAULT false,
  screen_enabled boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',  -- 'active' | 'ended' | 'error'
  latest_camera_url text,
  latest_screen_url text,
  snapshot_count integer DEFAULT 0,
  UNIQUE(attempt_id)
);

ALTER TABLE public.proctoring_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_proct_sessions_attempt ON public.proctoring_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proct_sessions_test    ON public.proctoring_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_proct_sessions_user    ON public.proctoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_proct_sessions_status  ON public.proctoring_sessions(status);

-- 4. Proctoring events — structured log per session
CREATE TABLE IF NOT EXISTS public.proctoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  test_id uuid NOT NULL,
  -- event_type: question_change | subject_change | focus_loss | focus_gain |
  --             fullscreen_exit | fullscreen_enter | tab_switch |
  --             permission_denied | camera_snapshot | screen_snapshot |
  --             test_start | test_end | mic_toggle
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_proct_events_session  ON public.proctoring_events(session_id);
CREATE INDEX IF NOT EXISTS idx_proct_events_test     ON public.proctoring_events(test_id);
CREATE INDEX IF NOT EXISTS idx_proct_events_created  ON public.proctoring_events(created_at DESC);

-- ── RLS POLICIES ──────────────────────────────────────────────

-- proctoring_allowlist
CREATE POLICY "Staff manage proctoring allowlist"
  ON public.proctoring_allowlist FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users view own proctoring allowlist"
  ON public.proctoring_allowlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- proctoring_sessions
CREATE POLICY "Staff view all proctoring sessions"
  ON public.proctoring_sessions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Users insert own proctoring session"
  ON public.proctoring_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own proctoring session"
  ON public.proctoring_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users select own proctoring session"
  ON public.proctoring_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- proctoring_events
CREATE POLICY "Staff view all proctoring events"
  ON public.proctoring_events FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Users insert own proctoring events"
  ON public.proctoring_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users select own proctoring events"
  ON public.proctoring_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── STORAGE BUCKET ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('proctoring-snapshots', 'proctoring-snapshots', false)
ON CONFLICT (id) DO NOTHING;

-- Only the owner can upload; staff can read for monitoring
CREATE POLICY "Users upload own proctoring snapshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proctoring-snapshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Staff view proctoring snapshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proctoring-snapshots' AND public.is_staff(auth.uid()));

CREATE POLICY "Users view own proctoring snapshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'proctoring-snapshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── HELPER: check if user is on allowlist (or allowlist not required) ──
CREATE OR REPLACE FUNCTION public.is_proctoring_allowed(_user_id uuid, _test_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- If proctoring not enabled for the test, return false (no session needed)
    CASE
      WHEN NOT (SELECT proctoring_enabled FROM public.tests WHERE id = _test_id) THEN false
      WHEN NOT (SELECT proctoring_allowlist_only FROM public.tests WHERE id = _test_id) THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.proctoring_allowlist
        WHERE test_id = _test_id AND user_id = _user_id
      )
    END
$$;
