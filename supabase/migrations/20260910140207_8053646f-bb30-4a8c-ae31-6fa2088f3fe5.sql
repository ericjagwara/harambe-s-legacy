CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  is_in_kind BOOLEAN NOT NULL DEFAULT false,
  in_kind_note TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contributions TO anon;
GRANT SELECT ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions are publicly viewable"
ON public.contributions FOR SELECT
USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;