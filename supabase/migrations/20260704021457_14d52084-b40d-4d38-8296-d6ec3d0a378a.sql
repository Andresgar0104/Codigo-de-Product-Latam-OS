
-- Helper: is the caller an active team member?
CREATE OR REPLACE FUNCTION public.is_active_team_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_team_member(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_active_team_member(uuid) TO authenticated, service_role;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated full access" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated full access" ON public.companies;
DROP POLICY IF EXISTS "Authenticated full access" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated full access" ON public.deals;
DROP POLICY IF EXISTS "Authenticated full access" ON public.events;
DROP POLICY IF EXISTS "Authenticated full access" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated full access" ON public.touchpoints;
DROP POLICY IF EXISTS "Authenticated full access" ON public.venues;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

-- Team-member-scoped policies
CREATE POLICY "Team members full access" ON public.workspaces
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.contacts
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.deals
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.events
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.tasks
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.touchpoints
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

CREATE POLICY "Team members full access" ON public.venues
  FOR ALL TO authenticated
  USING (public.is_active_team_member(auth.uid()))
  WITH CHECK (public.is_active_team_member(auth.uid()));

-- Profiles: team members can view teammates (needed for team page); own-row insert/update remain
CREATE POLICY "Team members can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_active_team_member(auth.uid()));
