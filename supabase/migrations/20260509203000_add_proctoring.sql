-- Proctoring settings on tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS proctoring_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_provider text DEFAULT 'webrtc',
  ADD COLUMN IF NOT EXISTS proctoring_require_camera boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_require_mic boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_require_screen boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_allowlist_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_recording_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proctoring_retention_days integer DEFAULT 0;

-- Allowlist for monitored users (optional overrides)
CREATE TABLE IF NOT EXISTS public.proctoring_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_allowed boolean NOT NULL DEFAULT true,
  require_camera boolean,
  require_mic boolean,
  require_screen boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(test_id, user_id)
);

-- Proctoring sessions tied to attempts
CREATE TABLE IF NOT EXISTS public.proctoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  provider text NOT NULL DEFAULT 'webrtc',
  camera_enabled boolean NOT NULL DEFAULT false,
  mic_enabled boolean NOT NULL DEFAULT false,
  screen_enabled boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Proctoring events (focus, fullscreen, question movement, permissions, etc.)
CREATE TABLE IF NOT EXISTS public.proctoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Signaling table for WebRTC (offer/answer/ice)
CREATE TABLE IF NOT EXISTS public.proctoring_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  signal_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proctoring_allowlist_test ON public.proctoring_allowlist(test_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_allowlist_user ON public.proctoring_allowlist(user_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_test ON public.proctoring_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_user ON public.proctoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_session ON public.proctoring_events(session_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_signals_session ON public.proctoring_signals(session_id);

ALTER TABLE public.proctoring_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_signals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_proctoring_participant(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proctoring_sessions
    WHERE id = _session_id AND user_id = _user_id
  ) OR public.is_staff(_user_id)
$$;

CREATE POLICY "Staff manage proctoring allowlist"
ON public.proctoring_allowlist FOR ALL
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users view own proctoring allowlist"
ON public.proctoring_allowlist FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users manage own proctoring sessions"
ON public.proctoring_sessions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff view proctoring sessions"
ON public.proctoring_sessions FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff update proctoring sessions"
ON public.proctoring_sessions FOR UPDATE
USING (public.is_staff(auth.uid()));

CREATE POLICY "Participants insert proctoring events"
ON public.proctoring_events FOR INSERT
WITH CHECK (public.is_proctoring_participant(auth.uid(), session_id));

CREATE POLICY "Participants view proctoring events"
ON public.proctoring_events FOR SELECT
USING (public.is_proctoring_participant(auth.uid(), session_id));

CREATE POLICY "Participants insert signals"
ON public.proctoring_signals FOR INSERT
WITH CHECK (public.is_proctoring_participant(auth.uid(), session_id));

CREATE POLICY "Participants view signals"
ON public.proctoring_signals FOR SELECT
USING (public.is_proctoring_participant(auth.uid(), session_id));

CREATE TRIGGER update_proctoring_allowlist_updated_at
BEFORE UPDATE ON public.proctoring_allowlist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proctoring_sessions_updated_at
BEFORE UPDATE ON public.proctoring_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
