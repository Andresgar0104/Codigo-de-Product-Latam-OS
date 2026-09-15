
-- 1. Create join table
CREATE TABLE public.event_contacts (
  id text PRIMARY KEY,
  "eventId" text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  "contactId" text NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'asistio' CHECK (status IN ('registrado','asistio','no_show')),
  role text NOT NULL DEFAULT 'asistente' CHECK (role IN ('asistente','speaker','cohost')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("eventId","contactId")
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_contacts TO authenticated;
GRANT ALL ON public.event_contacts TO service_role;

ALTER TABLE public.event_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members manage event_contacts"
  ON public.event_contacts
  FOR ALL
  TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE INDEX event_contacts_event_idx ON public.event_contacts ("eventId");
CREATE INDEX event_contacts_contact_idx ON public.event_contacts ("contactId");

-- 2. Backfill from contacts.eventId
INSERT INTO public.event_contacts (id, "eventId", "contactId", status, role)
SELECT
  'ec_' || replace(gen_random_uuid()::text, '-', ''),
  c."eventId",
  c.id,
  CASE WHEN 'Asistió a evento' = ANY(COALESCE(c.tags, ARRAY[]::text[])) THEN 'asistio' ELSE 'registrado' END,
  'asistente'
FROM public.contacts c
WHERE c."eventId" IS NOT NULL
  AND c."eventId" <> ''
  AND c."eventId" IN (SELECT id FROM public.events)
ON CONFLICT ("eventId","contactId") DO NOTHING;

-- 3. Drop the obsolete single-event column
ALTER TABLE public.contacts DROP COLUMN "eventId";
