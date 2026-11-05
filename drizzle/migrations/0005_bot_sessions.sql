CREATE TABLE IF NOT EXISTS public.bot_sessions (
  phone text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_sessions TO service_role;
REVOKE ALL ON public.bot_sessions FROM anon, authenticated;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;