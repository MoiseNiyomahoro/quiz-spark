ALTER TABLE public.sessions ALTER COLUMN auto_advance SET DEFAULT false;
UPDATE public.sessions SET auto_advance = false WHERE status = 'lobby';