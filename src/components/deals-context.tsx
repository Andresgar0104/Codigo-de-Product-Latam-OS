import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Deal, Company, Contact, Stage, Task, TaskStatus,
  Event, Venue, Touchpoint, Workspace,
  EventContact, EventContactStatus, EventContactRole,
  EventAttribute, EventPartner, EventPartnerRole,
} from "@/lib/mock-data";


interface Ctx {
  loading: boolean;

  workspaces: Workspace[];
  addWorkspace: (w: Workspace) => Promise<void>;

  deals: Deal[];
  addDeal: (contactId: string) => Deal | null;
  updateDealStage: (dealId: string, stage: Stage) => void;
  updateDealValue: (dealId: string, value: number | undefined) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  dealForContact: (contactId: string, workspaceId: string) => Deal | undefined;

  companies: Company[];
  addCompany: (input: { name: string; domain: string; workspaceId: string }) => Company;
  updateCompany: (id: string, patch: { name: string; domain: string }) => void;
  deleteCompany: (id: string, mergeIntoId?: string) => void;

  contacts: Contact[];
  addContact: (c: Contact) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;

  tasks: Task[];
  addTask: (eventId: string, status?: TaskStatus, title?: string) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  events: Event[];
  addEvent: (input: Event) => void;
  updateEvent: (id: string, patch: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  venues: Venue[];
  addVenue: (input: Venue) => void;
  updateVenue: (id: string, patch: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;

  touchpoints: Touchpoint[];
  getTouchpoints: (contactId: string) => Touchpoint[];
  addTouchpoint: (tp: Omit<Touchpoint, "id">) => void;
  deleteTouchpoint: (id: string) => void;

  eventContacts: EventContact[];
  eventContactsForEvent: (eventId: string) => EventContact[];
  eventsForContact: (contactId: string) => EventContact[];
  addEventContact: (input: { eventId: string; contactId: string; status?: EventContactStatus; role?: EventContactRole }) => Promise<void>;
  updateEventContact: (id: string, patch: Partial<Pick<EventContact, "status" | "role">>) => Promise<void>;
  deleteEventContact: (id: string) => Promise<void>;

  eventAttributes: EventAttribute[];
  attributesForEvent: (eventId: string) => EventAttribute[];
  addEventAttribute: (input: { eventId: string; label: string; value?: string }) => Promise<void>;
  updateEventAttribute: (id: string, patch: Partial<Pick<EventAttribute, "label" | "value">>) => Promise<void>;
  deleteEventAttribute: (id: string) => Promise<void>;

  eventPartners: EventPartner[];
  partnersForEvent: (eventId: string) => EventPartner[];
  addEventPartner: (input: { eventId: string; companyId: string; role: EventPartnerRole }) => Promise<void>;
  deleteEventPartner: (id: string) => Promise<void>;

  refreshData: () => Promise<void>;
}

const StoreContext = createContext<Ctx | null>(null);

// Normalize a deal row (value may come back as null).
function normalizeDeal(d: any): Deal {
  return { ...d, value: d.value == null ? undefined : Number(d.value) };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [eventContacts, setEventContacts] = useState<EventContact[]>([]);
  const [eventAttributes, setEventAttributes] = useState<EventAttribute[]>([]);
  const [eventPartners, setEventPartners] = useState<EventPartner[]>([]);

  const loadAll = useCallback(async () => {
    const [w, co, ct, dl, tk, ev, vn, tp, ec, ea, ep] = await Promise.all([
      supabase.from("workspaces").select("*"),
      supabase.from("companies").select("*"),
      supabase.from("contacts").select("*"),
      supabase.from("deals").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("events").select("*"),
      supabase.from("venues").select("*"),
      supabase.from("touchpoints").select("*"),
      supabase.from("event_contacts").select("*"),
      supabase.from("event_attributes").select("*"),
      supabase.from("event_partners").select("*"),
    ]);
    setWorkspaces((w.data ?? []) as Workspace[]);
    setCompanies((co.data ?? []) as Company[]);
    setContacts((ct.data ?? []) as Contact[]);
    setDeals(((dl.data ?? []) as any[]).map(normalizeDeal));
    setTasks((tk.data ?? []) as Task[]);
    setEvents((ev.data ?? []) as Event[]);
    setVenues((vn.data ?? []) as Venue[]);
    setTouchpoints((tp.data ?? []) as Touchpoint[]);
    setEventContacts((ec.data ?? []) as EventContact[]);
    setEventAttributes((ea.data ?? []) as EventAttribute[]);
    setEventPartners((ep.data ?? []) as EventPartner[]);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await loadAll();
      } catch (err) {
        console.error("[Store] load failed", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [loadAll]);

  const refreshData = useCallback(async () => {
    try { await loadAll(); } catch (e) { console.error("[Store] refresh failed", e); }
  }, [loadAll]);


  // ---- workspaces ----
  const addWorkspace = useCallback(async (w: Workspace) => {
    setWorkspaces(prev => [...prev, w]);
    await supabase.from("workspaces").insert(w);
  }, []);

  // ---- touchpoints ----
  const getTouchpoints = useCallback((contactId: string) =>
    touchpoints.filter(t => t.contactId === contactId),
  [touchpoints]);

  const addTouchpoint = useCallback((tp: Omit<Touchpoint, "id">) => {
    const row: Touchpoint = { ...tp, id: `tp_${Date.now()}` };
    setTouchpoints(prev => [row, ...prev]);
    supabase.from("touchpoints").insert(row).then(({ error }) => {
      if (error) console.error("[touchpoints.insert]", error);
    });
  }, []);

  const deleteTouchpoint = useCallback((id: string) => {
    setTouchpoints(prev => prev.filter(t => t.id !== id));
    supabase.from("touchpoints").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[touchpoints.delete]", error);
    });
  }, []);

  // ---- deals ----
  const addDeal = useCallback((contactId: string) => {
    const c = contacts.find(x => x.id === contactId);
    if (!c) return null;
    const existing = deals.find(d => d.contactId === contactId && d.workspaceId === c.workspaceId);
    if (existing) return existing;
    const d: Deal = {
      id: `dl_${Date.now()}`,
      contactId,
      workspaceId: c.workspaceId,
      stage: "contacted",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDeals(prev => [...prev, d]);
    supabase.from("deals").insert(d).then(({ error }) => {
      if (error) console.error("[deals.insert]", error);
    });
    return d;
  }, [deals, contacts]);

  const updateDealStage = useCallback((dealId: string, stage: Stage) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d));
    supabase.from("deals").update({ stage }).eq("id", dealId).then(({ error }) => {
      if (error) console.error("[deals.updateStage]", error);
    });
  }, []);

  const updateDealValue = useCallback((dealId: string, value: number | undefined) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, value } : d));
    supabase.from("deals").update({ value: value ?? null }).eq("id", dealId).then(({ error }) => {
      if (error) console.error("[deals.updateValue]", error);
    });
  }, []);

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    supabase.from("deals").update(patch as any).eq("id", id).then(({ error }) => {
      if (error) console.error("[deals.update]", error);
    });
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    supabase.from("deals").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[deals.delete]", error);
    });
  }, []);

  const dealForContact = useCallback((contactId: string, workspaceId: string) => {
    return deals.find(d => d.contactId === contactId && d.workspaceId === workspaceId);
  }, [deals]);

  // ---- companies ----
  const addCompany = useCallback((input: { name: string; domain: string; workspaceId: string }) => {
    const c: Company = {
      id: `co_${Date.now()}`,
      name: input.name,
      domain: input.domain,
      industry: "",
      size: "",
      country: "",
      workspaceId: input.workspaceId,
    };
    setCompanies(prev => [c, ...prev]);
    supabase.from("companies").insert(c).then(({ error }) => {
      if (error) console.error("[companies.insert]", error);
    });
    return c;
  }, []);

  const updateCompany = useCallback((id: string, patch: { name: string; domain: string }) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    supabase.from("companies").update(patch).eq("id", id).then(({ error }) => {
      if (error) console.error("[companies.update]", error);
    });
  }, []);

  const deleteCompany = useCallback((id: string, mergeIntoId?: string) => {
    if (mergeIntoId) {
      setContacts(prev => prev.map(c => c.companyId === id ? { ...c, companyId: mergeIntoId } : c));
      supabase.from("contacts").update({ companyId: mergeIntoId }).eq("companyId", id).then(({ error }) => {
        if (error) console.error("[contacts.updateCompanyId]", error);
      });
    }
    setCompanies(prev => prev.filter(c => c.id !== id));
    supabase.from("companies").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[companies.delete]", error);
    });
  }, []);

  // ---- contacts ----
  const addContact = useCallback((c: Contact) => {
    setContacts(prev => [c, ...prev]);
    supabase.from("contacts").insert(c).then(({ error }) => {
      if (error) console.error("[contacts.insert]", error);
    });
  }, []);

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    supabase.from("contacts").update(patch as any).eq("id", id).then(({ error }) => {
      if (error) console.error("[contacts.update]", error);
    });
  }, []);

  // ---- tasks ----
  const addTask = useCallback((eventId: string, status: TaskStatus = "todo", title = "") => {
    const t: Task = {
      id: `tk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      eventId,
      title,
      status,
    };
    setTasks(prev => [...prev, t]);
    supabase.from("tasks").insert(t).then(({ error }) => {
      if (error) console.error("[tasks.insert]", error);
    });
    return t;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    supabase.from("tasks").update(patch as any).eq("id", id).then(({ error }) => {
      if (error) console.error("[tasks.update]", error);
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    supabase.from("tasks").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[tasks.delete]", error);
    });
  }, []);

  // ---- events ----
  const addEvent = useCallback((input: Event) => {
    setEvents(prev => [input, ...prev]);
    supabase.from("events").insert(input as any).then(({ error }) => {
      if (error) console.error("[events.insert]", error);
    });
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    supabase.from("events").update(patch as any).eq("id", id).then(({ error }) => {
      if (error) console.error("[events.update]", error);
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    supabase.from("events").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[events.delete]", error);
    });
  }, []);

  // ---- venues ----
  const addVenue = useCallback((input: Venue) => {
    setVenues(prev => [...prev, input]);
    supabase.from("venues").insert(input as any).then(({ error }) => {
      if (error) console.error("[venues.insert]", error);
    });
  }, []);

  const updateVenue = useCallback((id: string, patch: Partial<Venue>) => {
    setVenues(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));
    supabase.from("venues").update(patch as any).eq("id", id).then(({ error }) => {
      if (error) console.error("[venues.update]", error);
    });
  }, []);

  const deleteVenue = useCallback((id: string) => {
    setVenues(prev => prev.filter(v => v.id !== id));
    supabase.from("venues").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[venues.delete]", error);
    });
  }, []);

  // ---- event_contacts ----
  const eventContactsForEvent = useCallback(
    (eventId: string) => eventContacts.filter(ec => ec.eventId === eventId),
    [eventContacts]
  );

  const eventsForContact = useCallback(
    (contactId: string) => eventContacts.filter(ec => ec.contactId === contactId),
    [eventContacts]
  );

  const addEventContact = useCallback(async (input: {
    eventId: string; contactId: string; status?: EventContactStatus; role?: EventContactRole;
  }) => {
    const row: EventContact = {
      id: `ec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventId: input.eventId,
      contactId: input.contactId,
      status: input.status ?? "asistio",
      role: input.role ?? "asistente",
      createdAt: new Date().toISOString(),
    };
    setEventContacts(prev => [...prev, row]);
    const { error } = await supabase.from("event_contacts").insert(row as any);
    if (error) {
      console.error("[event_contacts.insert]", error);
      setEventContacts(prev => prev.filter(x => x.id !== row.id));
    }
  }, []);

  const updateEventContact = useCallback(async (id: string, patch: Partial<Pick<EventContact, "status" | "role">>) => {
    setEventContacts(prev => prev.map(ec => ec.id === id ? { ...ec, ...patch } : ec));
    const { error } = await supabase.from("event_contacts").update(patch as any).eq("id", id);
    if (error) console.error("[event_contacts.update]", error);
  }, []);

  const deleteEventContact = useCallback(async (id: string) => {
    setEventContacts(prev => prev.filter(ec => ec.id !== id));
    const { error } = await supabase.from("event_contacts").delete().eq("id", id);
    if (error) console.error("[event_contacts.delete]", error);
  }, []);

  // ---- event_attributes ----
  const attributesForEvent = useCallback(
    (eventId: string) => eventAttributes.filter(a => a.eventId === eventId),
    [eventAttributes]
  );

  const addEventAttribute = useCallback(async (input: { eventId: string; label: string; value?: string }) => {
    const row: EventAttribute = {
      id: `ea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventId: input.eventId,
      label: input.label,
      value: input.value ?? "",
      createdAt: new Date().toISOString(),
    };
    setEventAttributes(prev => [...prev, row]);
    const { error } = await supabase.from("event_attributes").insert(row as any);
    if (error) {
      console.error("[event_attributes.insert]", error);
      setEventAttributes(prev => prev.filter(x => x.id !== row.id));
    }
  }, []);

  const updateEventAttribute = useCallback(async (id: string, patch: Partial<Pick<EventAttribute, "label" | "value">>) => {
    setEventAttributes(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    const { error } = await supabase.from("event_attributes").update(patch as any).eq("id", id);
    if (error) console.error("[event_attributes.update]", error);
  }, []);

  const deleteEventAttribute = useCallback(async (id: string) => {
    setEventAttributes(prev => prev.filter(a => a.id !== id));
    const { error } = await supabase.from("event_attributes").delete().eq("id", id);
    if (error) console.error("[event_attributes.delete]", error);
  }, []);

  // ---- event_partners ----
  const partnersForEvent = useCallback(
    (eventId: string) => eventPartners.filter(p => p.eventId === eventId),
    [eventPartners]
  );

  const addEventPartner = useCallback(async (input: { eventId: string; companyId: string; role: EventPartnerRole }) => {
    const row: EventPartner = {
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventId: input.eventId,
      companyId: input.companyId,
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    setEventPartners(prev => [...prev, row]);
    const { error } = await supabase.from("event_partners").insert(row as any);
    if (error) {
      console.error("[event_partners.insert]", error);
      setEventPartners(prev => prev.filter(x => x.id !== row.id));
    }
  }, []);

  const deleteEventPartner = useCallback(async (id: string) => {
    setEventPartners(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from("event_partners").delete().eq("id", id);
    if (error) console.error("[event_partners.delete]", error);
  }, []);

  return (
    <StoreContext.Provider value={{
      loading,
      workspaces, addWorkspace,
      deals, addDeal, updateDealStage, updateDealValue, updateDeal, deleteDeal, dealForContact,
      companies, addCompany, updateCompany, deleteCompany,
      contacts, addContact, updateContact,
      tasks, addTask, updateTask, deleteTask,
      events, addEvent, updateEvent, deleteEvent,
      venues, addVenue, updateVenue, deleteVenue,
      touchpoints, getTouchpoints, addTouchpoint, deleteTouchpoint,
      eventContacts, eventContactsForEvent, eventsForContact,
      addEventContact, updateEventContact, deleteEventContact,
      eventAttributes, attributesForEvent, addEventAttribute, updateEventAttribute, deleteEventAttribute,
      eventPartners, partnersForEvent, addEventPartner, deleteEventPartner,
      refreshData,
    }}>

      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-[12px] text-muted-foreground">Cargando datos…</div>
        </div>
      ) : children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const useDeals = useStore;
export const useChecklist = useStore;

// -------- Shared readiness helpers (kept for callers still using them) --------

export interface SetupCriterion { label: string; ok: boolean }

export function getSetupCriteria(e: Event): SetupCriterion[] {
  return [
    { label: "Venue asignado", ok: !!e.venueId },
    { label: "Landing URL configurada", ok: !!e.landingUrl },
    { label: "Al menos un cohost", ok: (e.cohosts ?? 0) > 0 },
    { label: "Al menos un speaker", ok: (e.speakers ?? 0) > 0 },
    { label: "Formato definido", ok: !!e.formato },
    { label: "Capacidad definida", ok: e.target > 0 },
    { label: "Audiencia objetivo definida", ok: !!e.audienciaObjetivo },
  ];
}

export interface EventStatus {
  pct: number;
  setupPct: number;
  setupCriteria: SetupCriterion[];
  checklistDone: number;
  checklistTotal: number;
  hasChecklist: boolean;
}

export function computeEventStatus(e: Event, allTasks: Task[]): EventStatus {
  const setupCriteria = getSetupCriteria(e);
  const setupPct = (setupCriteria.filter(c => c.ok).length / setupCriteria.length) * 100;
  const evTasks = allTasks.filter(t => t.eventId === e.id);
  const checklistTotal = evTasks.length;
  const checklistDone = evTasks.filter(t => t.status === "done").length;
  const hasChecklist = checklistTotal > 0;
  const checklistPct = hasChecklist ? (checklistDone / checklistTotal) * 100 : 0;
  const pct = hasChecklist
    ? Math.round(0.5 * setupPct + 0.5 * checklistPct)
    : Math.round(setupPct);
  return { pct, setupPct, setupCriteria, checklistDone, checklistTotal, hasChecklist };
}
