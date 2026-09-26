CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  reference_code TEXT,
  purpose TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  msisdn TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'PENDING',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  contribution_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX payments_reference_code_idx ON public.payments (reference_code);