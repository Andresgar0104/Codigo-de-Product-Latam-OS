-- STEP 1: Clean orphaned references
DELETE FROM public.tasks WHERE "eventId" NOT IN (SELECT id FROM public.events);
DELETE FROM public.touchpoints WHERE "contactId" NOT IN (SELECT id FROM public.contacts);
DELETE FROM public.deals WHERE "contactId" NOT IN (SELECT id FROM public.contacts);
UPDATE public.contacts SET "companyId" = NULL WHERE "companyId" IS NOT NULL AND "companyId" NOT IN (SELECT id FROM public.companies);

-- STEP 2: Foreign keys
ALTER TABLE public.companies ADD CONSTRAINT companies_workspace_fk FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.contacts  ADD CONSTRAINT contacts_workspace_fk  FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.contacts  ADD CONSTRAINT contacts_company_fk    FOREIGN KEY ("companyId")   REFERENCES public.companies(id)  ON DELETE SET NULL;
ALTER TABLE public.deals     ADD CONSTRAINT deals_workspace_fk     FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.deals     ADD CONSTRAINT deals_contact_fk       FOREIGN KEY ("contactId")   REFERENCES public.contacts(id)   ON DELETE CASCADE;
ALTER TABLE public.events    ADD CONSTRAINT events_workspace_fk    FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.tasks     ADD CONSTRAINT tasks_event_fk         FOREIGN KEY ("eventId")     REFERENCES public.events(id)     ON DELETE CASCADE;
ALTER TABLE public.venues    ADD CONSTRAINT venues_workspace_fk    FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.touchpoints ADD CONSTRAINT touchpoints_contact_fk FOREIGN KEY ("contactId") REFERENCES public.contacts(id)   ON DELETE CASCADE;

-- STEP 3: Normalize then CHECK
UPDATE public.deals  SET stage    = 'contacted' WHERE stage    NOT IN ('contacted','engaged','meeting','proposal','won','lost');
UPDATE public.tasks  SET status   = 'todo'      WHERE status   NOT IN ('todo','doing','done');
UPDATE public.tasks  SET priority = NULL        WHERE priority IS NOT NULL AND priority NOT IN ('keep_in_mind','importante','urgente');
UPDATE public.events SET status   = 'upcoming'  WHERE status IS NULL OR status NOT IN ('upcoming','past');

ALTER TABLE public.deals  ADD CONSTRAINT deals_stage_check     CHECK (stage IN ('contacted','engaged','meeting','proposal','won','lost'));
ALTER TABLE public.tasks  ADD CONSTRAINT tasks_status_check    CHECK (status IN ('todo','doing','done'));
ALTER TABLE public.tasks  ADD CONSTRAINT tasks_priority_check  CHECK (priority IS NULL OR priority IN ('keep_in_mind','importante','urgente'));
ALTER TABLE public.events ADD CONSTRAINT events_status_check   CHECK (status IN ('upcoming','past'));

-- STEP 4: Unique email per workspace (case-insensitive, non-empty only)
CREATE UNIQUE INDEX contacts_ws_email_unique ON public.contacts ("workspaceId", lower(email)) WHERE email IS NOT NULL AND email <> '';