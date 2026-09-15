
CREATE TABLE public.workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  color TEXT NOT NULL,
  icp TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.workspaces FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  country TEXT,
  "workspaceId" TEXT NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.contacts (
  id TEXT PRIMARY KEY,
  name TEXT,
  title TEXT,
  email TEXT,
  linkedin TEXT,
  "companyId" TEXT,
  "eventId" TEXT,
  "workspaceId" TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lastTouch" TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT,
  city TEXT,
  registrations INT DEFAULT 0,
  target INT DEFAULT 0,
  status TEXT,
  cover TEXT,
  "workspaceId" TEXT NOT NULL,
  formato TEXT,
  "audienciaObjetivo" TEXT,
  outreach TEXT,
  cohosts INT,
  speakers INT,
  "landingUrl" TEXT,
  descripcion TEXT,
  "venueId" TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.venues (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  capacity INT DEFAULT 0,
  "imageUrl" TEXT,
  notes TEXT,
  ciudad TEXT,
  "googleMapsUrl" TEXT,
  "contactoPrincipal" JSONB
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.deals (
  id TEXT PRIMARY KEY,
  "contactId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  stage TEXT NOT NULL,
  value NUMERIC,
  "createdAt" TEXT NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.touchpoints (
  id TEXT PRIMARY KEY,
  "contactId" TEXT NOT NULL,
  channel TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.touchpoints TO authenticated;
GRANT ALL ON public.touchpoints TO service_role;
ALTER TABLE public.touchpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.touchpoints FOR ALL TO authenticated USING (true) WITH CHECK (true);
