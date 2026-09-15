import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Stat, StageChip, formatShortDate } from "@/components/ui-bits";
import {
  type TaskStatus, type TaskPriority,
  type EventContactStatus, type EventContactRole,
  type EventPartnerRole,
  EVENT_CONTACT_STATUS_LABEL, EVENT_CONTACT_ROLE_LABEL,
} from "@/lib/mock-data";
import { useStore } from "@/components/deals-context";
import { CompanyCombobox } from "@/components/company-combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, Plus, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useRef, useEffect } from "react";
import { sortPendingTasks } from "@/lib/tasks";
import { TaskDueDate } from "@/components/task-due-date";
import { EventFormDialog } from "@/components/event-form-dialog";


export const Route = createFileRoute("/events/$eventId")({
  head: () => ({ meta: [{ title: "Event · Taltics" }] }),
  component: EventDetail,
  notFoundComponent: () => <AppShell><div className="p-6 text-muted-foreground">Event not found.</div></AppShell>,
});

const PRIORITY_META: Record<TaskPriority, { label: string; cls: string; short: string }> = {
  keep_in_mind: { label: "To keep in mind", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", short: "•" },
  importante: { label: "importante", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", short: "I" },
  urgente: { label: "urgente", cls: "bg-red-500/15 text-red-300 border-red-500/30", short: "U" },
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

function EventDetail() {
  const { eventId } = Route.useParams();
  const {
    events, venues, tasks, contacts, companies, deals,
    updateTask, updateEvent, deleteEvent, addCompany,
    eventContactsForEvent, addEventContact, updateEventContact, deleteEventContact,
    attributesForEvent, addEventAttribute, updateEventAttribute, deleteEventAttribute,
    partnersForEvent, addEventPartner, deleteEventPartner,
  } = useStore();
  const event = events.find(e => e.id === eventId);
  if (!event) throw notFound();

  const [editOpen, setEditOpen] = useState(false);

  const evTasks = useMemo(() => tasks.filter(t => t.eventId === event.id), [tasks, event.id]);
  const checklistDone = evTasks.filter(t => t.status === "done").length;
  const checklistTotal = evTasks.length;

  const evLinks = useMemo(() => eventContactsForEvent(event.id), [eventContactsForEvent, event.id]);
  const linkedContactIds = useMemo(() => new Set(evLinks.map(l => l.contactId)), [evLinks]);
  const registeredCount = evLinks.length;
  const attendedCount = evLinks.filter(l => l.status === "asistio").length;

  const speakers = useMemo(() => evLinks.filter(l => l.role === "speaker"), [evLinks]);
  const attendees = useMemo(() => evLinks.filter(l => l.role === "asistente"), [evLinks]);

  const evPartners = useMemo(() => partnersForEvent(event.id), [partnersForEvent, event.id]);
  const cohostPartners = evPartners.filter(p => p.role === "cohost");
  const sponsorPartners = evPartners.filter(p => p.role === "sponsor");

  const evAttributes = useMemo(() => attributesForEvent(event.id), [attributesForEvent, event.id]);

  const evDeals = useMemo(
    () => deals.filter(d => linkedContactIds.has(d.contactId)),
    [deals, linkedContactIds]
  );

  const pending = useMemo(() => sortPendingTasks(evTasks.filter(t => t.status !== "done")), [evTasks]);
  const pendingVisible = pending.slice(0, 8);

  const cols: { id: TaskStatus; label: string }[] = [
    { id: "todo", label: "To do" },
    { id: "doing", label: "Doing" },
    { id: "done", label: "Done" },
  ];
  const priorityCls: Record<string, string> = {
    keep_in_mind: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    importante: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    urgente: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  const wsVenues = venues.filter(v => v.workspaceId === event.workspaceId);
  const wsContacts = contacts.filter(c => c.workspaceId === event.workspaceId);
  const wsCompanies = companies.filter(c => c.workspaceId === event.workspaceId);

  const wsContactsAvailableAsSpeaker = wsContacts.filter(c => !evLinks.find(l => l.contactId === c.id && l.role === "speaker"));
  const wsContactsAvailableAsAttendee = wsContacts.filter(c => !evLinks.find(l => l.contactId === c.id && l.role === "asistente"));

  const cohostCompanyIds = new Set(cohostPartners.map(p => p.companyId));
  const sponsorCompanyIds = new Set(sponsorPartners.map(p => p.companyId));

  const statusBadge = (
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded border",
      event.status === "upcoming" && "bg-blue-500/15 text-blue-300 border-blue-500/30",
      event.status === "live" && "bg-green-500/15 text-green-300 border-green-500/30",
      event.status === "past" && "bg-slate-500/15 text-slate-300 border-slate-500/30",
    )}>{event.status}</span>
  );

  return (
    <AppShell>
      <PageHeader
        title={event.name}
        subtitle={<span className="inline-flex items-center gap-2">{`${event.city ? `${event.city} · ` : ""}${formatShortDate(event.date)}`} {statusBadge}</span> as any}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="h-8 px-3 inline-flex items-center gap-1 rounded-md text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3" /> Editar
            </button>
            <button
              onClick={() => {
                if (confirm("¿Eliminar este evento?")) {
                  deleteEvent(event.id);
                  window.history.back();
                }
              }}
              className="h-8 px-3 inline-flex items-center gap-1 rounded-md text-[12px] text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
            >
              <X className="size-3" /> Eliminar
            </button>
            <Link to="/events" className="h-8 px-3 inline-flex items-center rounded-md text-[12px] text-muted-foreground hover:bg-muted">← Volver</Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* METRICS */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Stat label="Registrados" value={registeredCount} />
          <Stat label="Asistieron" value={attendedCount} />
          <Stat label="Tareas" value={`${checklistDone}/${checklistTotal}`} />
          <Stat label="Deals generados" value={evDeals.length} />
        </div>

        {/* INFO */}
        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Información</h2>
            <button
              onClick={() => setEditOpen(true)}
              className="h-7 px-2 inline-flex items-center gap-1 rounded-md text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3" /> Editar
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Formato" value={event.formato ?? "—"} />
            <Field label="Capacidad" value={event.target === 0 ? "Ilimitada" : String(event.target)} />
            <Field label="Audiencia objetivo" value={event.audienciaObjetivo ?? "—"} />

            <div className="col-span-2">
              <FieldLabel>Venue</FieldLabel>
              <div className="flex items-center gap-2">
                <select
                  value={event.venueId ?? ""}
                  onChange={(e) => updateEvent(event.id, { venueId: e.target.value || undefined })}
                  className="h-8 px-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring min-w-[240px]"
                >
                  <option value="">— Sin venue —</option>
                  {wsVenues.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (cap {v.capacity})</option>
                  ))}
                </select>
                <Link to="/venues" className="text-[11px] text-primary hover:underline">Ver venues →</Link>
              </div>
            </div>
            <div className="col-span-2">
              <FieldLabel>Landing / URL Luma</FieldLabel>
              {event.landingUrl ? (
                <a href={event.landingUrl} target="_blank" rel="noreferrer" className="text-[13px] text-primary hover:underline inline-flex items-center gap-1 break-all">
                  {event.landingUrl} <ExternalLink className="size-3" />
                </a>
              ) : <span className="text-[13px] text-muted-foreground">—</span>}
            </div>
            <div className="col-span-2">
              <FieldLabel>Descripción</FieldLabel>
              <p className="text-[13px] leading-relaxed">{event.descripcion || "—"}</p>
            </div>
          </div>
        </section>

        {/* TABS */}
        <Tabs defaultValue="tareas" className="w-full">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="tareas">Tareas ({checklistTotal})</TabsTrigger>
            <TabsTrigger value="cohosts">Cohosts ({evPartners.length})</TabsTrigger>
            <TabsTrigger value="speakers">Speakers ({speakers.length})</TabsTrigger>
            <TabsTrigger value="asistentes">Asistentes ({attendees.length})</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline ({evDeals.length})</TabsTrigger>
            <TabsTrigger value="atributos">Atributos ({evAttributes.length})</TabsTrigger>
          </TabsList>

          {/* TAREAS */}
          <TabsContent value="tareas" className="space-y-4">
            <section className="rounded-lg border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <h3 className="text-[13px] font-semibold">Pendientes</h3>
                <span className="text-[11px] text-muted-foreground tabular-nums">{pending.length}</span>
              </div>
              {pending.length === 0 ? (
                <div className="p-6 text-[12px] text-muted-foreground italic text-center">Sin pendientes 🎉</div>
              ) : (
                <ul className="divide-y divide-border">
                  {pendingVisible.map(t => {
                    const pMeta = t.priority ? PRIORITY_META[t.priority] : null;
                    return (
                      <li key={t.id} className="px-4 py-2.5 flex items-center gap-3">
                        <span className="flex-1 min-w-0 text-[13px] truncate">
                          {t.title || <span className="italic text-muted-foreground">sin título</span>}
                        </span>
                        {pMeta && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", pMeta.cls)}>
                            {pMeta.label}
                          </span>
                        )}
                        <TaskDueDate
                          dueDate={t.dueDate}
                          status={t.status}
                          onChange={(dueDate) => updateTask(t.id, { dueDate })}
                        />
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 tabular-nums">
                          {STATUS_LABEL[t.status]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <h3 className="text-[13px] font-semibold">Tablero</h3>
                <span className="text-[11px] text-muted-foreground tabular-nums">{checklistDone}/{checklistTotal}</span>
              </div>
              <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {cols.map(col => {
                  const colTasks = evTasks.filter(t => t.status === col.id);
                  return (
                    <div key={col.id} className="rounded-md border border-border bg-background/40">
                      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">{col.label}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums px-1.5 py-0.5 rounded bg-muted">{colTasks.length}</span>
                      </div>
                      <ul className="p-2 space-y-1.5 min-h-[60px]">
                        {colTasks.map(t => (
                          <li key={t.id} className="flex items-center gap-1.5 text-[12px]">
                            {t.priority && (
                              <span className={cn("text-[9px] px-1 py-0.5 rounded border shrink-0", priorityCls[t.priority])}>
                                {t.priority === "keep_in_mind" ? "•" : t.priority[0].toUpperCase()}
                              </span>
                            )}
                            <span className="truncate flex-1 min-w-0">
                              {t.title || <span className="italic text-muted-foreground">sin título</span>}
                            </span>
                            <TaskDueDate
                              dueDate={t.dueDate}
                              status={t.status}
                              onChange={(dueDate) => updateTask(t.id, { dueDate })}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <Link to="/tareas" className="block px-4 py-2.5 text-[12px] text-primary hover:bg-muted/30 border-t border-border">
                Ver tablero completo →
              </Link>
            </section>
          </TabsContent>

          {/* COHOSTS */}
          <TabsContent value="cohosts" className="space-y-4">
            <PartnerGroup
              title="Co-hosts"
              partners={cohostPartners}
              companies={companies}
              excludedIds={cohostCompanyIds}
              availableCompanies={wsCompanies.filter(c => !cohostCompanyIds.has(c.id))}
              onRemove={(id) => deleteEventPartner(id)}
              onAdd={async (companyId) => { await addEventPartner({ eventId: event.id, companyId, role: "cohost" }); }}
              onCreateCompany={(name) => addCompany({ name, domain: "", workspaceId: event.workspaceId })}
              emptyText="Sin co-hosts"
              addLabel="+ Agregar co-host"
            />
            <PartnerGroup
              title="Sponsors"
              partners={sponsorPartners}
              companies={companies}
              excludedIds={sponsorCompanyIds}
              availableCompanies={wsCompanies.filter(c => !sponsorCompanyIds.has(c.id))}
              onRemove={(id) => deleteEventPartner(id)}
              onAdd={async (companyId) => { await addEventPartner({ eventId: event.id, companyId, role: "sponsor" }); }}
              onCreateCompany={(name) => addCompany({ name, domain: "", workspaceId: event.workspaceId })}
              emptyText="Sin sponsors"
              addLabel="+ Agregar sponsor"
            />
          </TabsContent>

          {/* SPEAKERS */}
          <TabsContent value="speakers">
            <PeopleList
              links={speakers}
              contacts={contacts}
              companies={companies}
              candidates={wsContactsAvailableAsSpeaker}
              onAdd={(contactId) => addEventContact({ eventId: event.id, contactId, status: "asistio", role: "speaker" })}
              onUpdate={(id, patch) => updateEventContact(id, patch)}
              onDelete={(id) => deleteEventContact(id)}
              emptyText="Sin speakers"
              addLabel="+ Agregar speaker"
            />
          </TabsContent>

          {/* ASISTENTES */}
          <TabsContent value="asistentes">
            <PeopleList
              links={attendees}
              contacts={contacts}
              companies={companies}
              candidates={wsContactsAvailableAsAttendee}
              onAdd={(contactId) => addEventContact({ eventId: event.id, contactId, status: "asistio", role: "asistente" })}
              onUpdate={(id, patch) => updateEventContact(id, patch)}
              onDelete={(id) => deleteEventContact(id)}
              emptyText="Sin asistentes"
              addLabel="+ Agregar asistente"
              showRole
            />
          </TabsContent>

          {/* PIPELINE */}
          <TabsContent value="pipeline">
            <section className="rounded-lg border border-border bg-card">
              {evDeals.length === 0 ? (
                <div className="p-6 text-[12px] text-muted-foreground italic text-center">Aún no hay deals generados desde este evento</div>
              ) : (
                <ul className="divide-y divide-border">
                  {evDeals.map(d => {
                    const c = contacts.find(x => x.id === d.contactId);
                    const co = c?.companyId ? companies.find(x => x.id === c.companyId) : undefined;
                    return (
                      <li key={d.id}>
                        <Link to="/pipeline" className="px-4 py-2.5 flex items-center gap-3 text-[13px] hover:bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{c?.name ?? "—"}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{co?.name ?? "—"}</div>
                          </div>
                          <StageChip stage={d.stage} />
                          {d.value != null && (
                            <span className="text-[12px] tabular-nums text-muted-foreground shrink-0">
                              ${d.value.toLocaleString()}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>

          {/* ATRIBUTOS */}
          <TabsContent value="atributos">
            <section className="rounded-lg border border-border bg-card">
              {evAttributes.length === 0 ? (
                <div className="p-6 text-[12px] text-muted-foreground italic text-center">
                  Sin atributos. Agrega campos personalizados para este evento (ej. Presupuesto, Tipo de comida, Contacto del venue).
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {evAttributes.map(a => (
                    <li key={a.id} className="px-4 py-2.5 flex items-center gap-2">
                      <input
                        defaultValue={a.label}
                        onBlur={(e) => { if (e.target.value !== a.label) updateEventAttribute(a.id, { label: e.target.value }); }}
                        placeholder="Etiqueta"
                        className="w-48 h-8 px-2 text-[12px] font-medium bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                      />
                      <input
                        defaultValue={a.value}
                        onBlur={(e) => { if (e.target.value !== a.value) updateEventAttribute(a.id, { value: e.target.value }); }}
                        placeholder="Valor"
                        className="flex-1 h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                      />
                      <button
                        type="button"
                        onClick={() => deleteEventAttribute(a.id)}
                        className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 py-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => addEventAttribute({ eventId: event.id, label: "Nuevo campo", value: "" })}
                  className="h-8 px-3 inline-flex items-center gap-1 rounded-md border border-dashed border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Plus className="size-3" /> Agregar atributo
                </button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <EventFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={event}
        title="Editar evento"
        submitLabel="Guardar cambios"
        onSubmit={(data) => {
          updateEvent(event.id, data);
          setEditOpen(false);
        }}
      />
    </AppShell>
  );
}

function PartnerGroup({
  title, partners, companies, availableCompanies, onRemove, onAdd, onCreateCompany, emptyText, addLabel,
}: {
  title: string;
  partners: { id: string; companyId: string }[];
  companies: { id: string; name: string; domain: string }[];
  excludedIds: Set<string>;
  availableCompanies: any[];
  onRemove: (id: string) => void;
  onAdd: (companyId: string) => Promise<void> | void;
  onCreateCompany: (name: string) => any;
  emptyText: string;
  addLabel: string;
}) {
  const [pickerValue, setPickerValue] = useState("");
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <span className="text-[11px] text-muted-foreground tabular-nums">{partners.length}</span>
      </div>
      {partners.length === 0 ? (
        <div className="p-4 text-[12px] text-muted-foreground italic text-center">{emptyText}</div>
      ) : (
        <ul className="divide-y divide-border">
          {partners.map(p => {
            const co = companies.find(c => c.id === p.companyId);
            return (
              <li key={p.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
                <span className="flex-1 min-w-0 truncate">{co?.name ?? "—"}</span>
                {co?.domain && <span className="text-[11px] text-muted-foreground truncate">{co.domain}</span>}
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="px-4 py-3 border-t border-border">
        <div className="text-[11px] text-muted-foreground mb-1">{addLabel}</div>
        <CompanyCombobox
          value={pickerValue}
          companies={availableCompanies}
          onChange={async (companyId) => {
            if (!companyId) return;
            setPickerValue("");
            await onAdd(companyId);
          }}
          onCreate={(name) => onCreateCompany(name)}
          allowClear={false}
        />
      </div>
    </section>
  );
}

function PeopleList({
  links, contacts, companies, candidates, onAdd, onUpdate, onDelete, emptyText, addLabel, showRole,
}: {
  links: { id: string; contactId: string; status: EventContactStatus; role: EventContactRole }[];
  contacts: { id: string; name: string; title: string; companyId: string }[];
  companies: { id: string; name: string }[];
  candidates: { id: string; name: string; title: string }[];
  onAdd: (contactId: string) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<{ status: EventContactStatus; role: EventContactRole }>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  emptyText: string;
  addLabel: string;
  showRole?: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      {links.length === 0 ? (
        <div className="p-6 text-[12px] text-muted-foreground italic text-center">{emptyText}</div>
      ) : (
        <ul className="divide-y divide-border">
          {links.map(link => {
            const c = contacts.find(x => x.id === link.contactId);
            if (!c) return null;
            const co = c.companyId ? companies.find(x => x.id === c.companyId) : undefined;
            return (
              <li key={link.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {c.title || "—"}{co ? ` · ${co.name}` : ""}
                  </div>
                </div>
                <select
                  value={link.status}
                  onChange={(e) => onUpdate(link.id, { status: e.target.value as EventContactStatus })}
                  className="h-7 px-1.5 text-[11px] bg-background border border-border rounded-md focus:outline-none focus:border-ring shrink-0"
                >
                  {(Object.keys(EVENT_CONTACT_STATUS_LABEL) as EventContactStatus[]).map(s => (
                    <option key={s} value={s}>{EVENT_CONTACT_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                {showRole && (
                  <select
                    value={link.role}
                    onChange={(e) => onUpdate(link.id, { role: e.target.value as EventContactRole })}
                    className="h-7 px-1.5 text-[11px] bg-background border border-border rounded-md focus:outline-none focus:border-ring shrink-0"
                  >
                    <option value="asistente">{EVENT_CONTACT_ROLE_LABEL.asistente}</option>
                    <option value="speaker">{EVENT_CONTACT_ROLE_LABEL.speaker}</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(link.id)}
                  className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="px-4 py-3 border-t border-border">
        <ContactPicker candidates={candidates} onPick={onAdd} label={addLabel} />
      </div>
    </section>
  );
}

function ContactPicker({
  candidates, onPick, label,
}: {
  candidates: { id: string; name: string; title: string }[];
  onPick: (id: string) => Promise<void> | void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    const arr = s ? candidates.filter(c => c.name.toLowerCase().includes(s)) : candidates;
    return arr.slice(0, 20);
  }, [candidates, query]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setQuery(""); }}
          className="h-8 px-3 inline-flex items-center gap-1 rounded-md border border-dashed border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Plus className="size-3" /> {label}
        </button>
      ) : (
        <div className="w-72">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar contacto…"
            className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
          />
          <div className="mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-lg">
            {filtered.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={async () => { await onPick(c.id); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted"
              >
                {c.name}
                {c.title && <span className="text-muted-foreground"> · {c.title}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-muted-foreground italic">Sin contactos disponibles.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{children}</div>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="text-[13px]">{value}</div>
    </div>
  );
}
