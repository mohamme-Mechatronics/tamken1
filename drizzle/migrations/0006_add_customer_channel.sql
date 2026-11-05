ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp';
COMMENT ON COLUMN public.customers.channel IS 'Conversation channel: whatsapp or telegram';