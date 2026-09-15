ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS "firstName" text,
  ADD COLUMN IF NOT EXISTS "lastName" text;

UPDATE public.contacts
SET
  "firstName" = COALESCE("firstName",
    CASE WHEN position(' ' in COALESCE(name, '')) > 0
      THEN split_part(name, ' ', 1)
      ELSE COALESCE(name, '')
    END),
  "lastName" = COALESCE("lastName",
    CASE WHEN position(' ' in COALESCE(name, '')) > 0
      THEN substring(name from position(' ' in name) + 1)
      ELSE ''
    END)
WHERE "firstName" IS NULL OR "lastName" IS NULL;