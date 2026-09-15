CREATE TABLE public.event_attributes (
  id text PRIMARY KEY,
  "eventId" text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attributes TO authenticated;
GRANT ALL ON public.event_attributes TO service_role;
ALTER TABLE public.event_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members manage event_attributes" ON public.event_attributes
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE TABLE public.event_partners (
  id text PRIMARY KEY,
  "eventId" text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  "companyId" text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'cohost' CHECK (role IN ('cohost','sponsor')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("eventId","companyId",role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_partners TO authenticated;
GRANT ALL ON public.event_partners TO service_role;
ALTER TABLE public.event_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members manage event_partners" ON public.event_partners
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));