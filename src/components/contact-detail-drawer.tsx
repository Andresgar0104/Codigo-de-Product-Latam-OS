import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TagChip } from "@/components/ui-bits";
import { CompanyCombobox } from "@/components/company-combobox";
import {
  TAG_OPTIONS, stageLabels,
  EVENT_CONTACT_STATUS_LABEL, EVENT_CONTACT_ROLE_LABEL,
  type Contact, type Touchpoint, type TouchpointChannel,
  type EventContactStatus, type EventContactRole,
  type Event as EventT,
} from "@/lib/mock-data";
import { useDeals, useStore } from "@/components/deals-context";
import { Mail, Linkedin, Phone, MessageCircle, Users as UsersIcon, CalendarDays, FileText, Plus, ArrowRight, X, ChevronDown } from "lucide-react";

function EventLinker({ events, onPick }: { events: EventT[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return events.slice(0, 20);
    return events.filter(e => e.name.toLowerCase().includes(s)).slice(0, 20);
  }, [events, query]);

  return (
    <div ref={wrapRef} className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setQuery(""); }}
          className="w-full h-8 px-2.5 text-left text-[12px] bg-background border border-dashed border-border rounded-md focus:outline-none focus:border-ring flex items-center justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="inline-flex items-center gap-1"><Plus className="size-3" /> Vincular a evento</span>
          <ChevronDown className="size-3.5" />
        </button>
      ) : (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar evento…"
          className="w-full h-8 px-2.5 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); }
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) { onPick(filtered[0].id); setOpen(false); setQuery(""); }
            }
          }}
        />
      )}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {filtered.map(e => (
            <button
              type="button"
              key={e.id}
              onClick={() => { onPick(e.id); setOpen(false); setQuery(""); }}
              className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted"
            >
              {e.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-muted-foreground italic">Sin eventos disponibles.</div>
          )}
        </div>
      )}
    </div>
  );
}

const CHANNELS: TouchpointChannel[] = ["Email", "LinkedIn", "Call", "WhatsApp", "Meeting", "Evento", "Notas"];

const channelIcon = (c: TouchpointChannel) => {
  switch (c) {
    case "Email": return Mail;
    case "LinkedIn": return Linkedin;
    case "Call": return Phone;
    case "WhatsApp": return MessageCircle;
    case "Meeting": return UsersIcon;
    case "Evento": return CalendarDays;
    case "Notas": return FileText;
  }
};

export function ContactDetailContent({
  contact, onClose, onChange, touchpoints, onAddTouchpoint,
}: {
  contact: Contact;
  onClose?: () => void;
  onChange: (patch: Partial<Contact>) => void;
  touchpoints: Touchpoint[];
  onAddTouchpoint: (tp: Touchpoint) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<{ date: string; channel: TouchpointChannel; note: string }>({
    date: new Date().toISOString().slice(0, 10),
    channel: "Email",
    note: "",
  });

  const { dealForContact, addDeal } = useDeals();
  const { companies, addCompany, eventsForContact, events, addEventContact, updateEventContact, deleteEventContact } = useStore();

  const wsCompanies = useMemo(
    () => contact ? companies.filter(c => c.workspaceId === contact.workspaceId) : [],
    [companies, contact]
  );
  const currentCo = contact ? wsCompanies.find(c => c.id === contact.companyId) : undefined;

  if (!contact) return null;
  const existingDeal = dealForContact(contact.id, contact.workspaceId);

  function addTag(t: string) {
    const tag = t.trim();
    if (!tag || !contact) return;
    if (contact.tags.includes(tag)) return;
    onChange({ tags: [...contact.tags, tag] });
    setTagInput("");
  }

  function removeTag(t: string) {
    if (!contact) return;
    onChange({ tags: contact.tags.filter(x => x !== t) });
  }

  function save() {
    onAddTouchpoint({
      id: `tp_${Date.now()}`,
      contactId: contact!.id,
      date: draft.date,
      channel: draft.channel,
      note: draft.note,
    });
    setDraft({ date: new Date().toISOString().slice(0, 10), channel: "Email", note: "" });
    setShowForm(false);
  }


  const suggestions = TAG_OPTIONS.filter(t =>
    !contact.tags.includes(t) &&
    (tagInput === "" || t.toLowerCase().includes(tagInput.toLowerCase()))
  );

  const firstName = contact.firstName ?? (contact.name?.includes(" ") ? contact.name.split(" ")[0] : contact.name ?? "");
  const lastName = contact.lastName ?? (contact.name?.includes(" ") ? contact.name.substring(contact.name.indexOf(" ") + 1) : "");
  const displayName = `${firstName} ${lastName}`.trim();

  function updateName(patch: { firstName?: string; lastName?: string }) {
    const nextFirst = patch.firstName ?? firstName;
    const nextLast = patch.lastName ?? lastName;
    onChange({
      firstName: nextFirst,
      lastName: nextLast,
      name: `${nextFirst} ${nextLast}`.trim(),
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{displayName || "—"}</div>
          <div className="text-[12px] text-muted-foreground truncate">
            {contact.title || "—"} · {currentCo?.name ?? "—"}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <X className="size-4" />
          </button>
        )}
      </div>


        <div className="mt-6 space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pipeline</label>
            <div className="mt-2">
              {existingDeal ? (
                <Link to="/pipeline" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary text-[12px] hover:bg-primary/15">
                  En pipeline · {stageLabels[existingDeal.stage]} <ArrowRight className="size-3" />
                </Link>
              ) : (
                <button
                  onClick={() => addDeal(contact.id)}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium"
                >
                  <ArrowRight className="size-3.5" /> Agregar a Pipeline
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nombre</label>
                <input
                  value={firstName}
                  onChange={(e) => updateName({ firstName: e.target.value })}
                  className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Apellido</label>
                <input
                  value={lastName}
                  onChange={(e) => updateName({ lastName: e.target.value })}
                  className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
                />
              </div>
            </div>

            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Puesto</label>
            <input
              value={contact.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
            />

            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Empresa</label>
            <CompanyCombobox
              value={contact.companyId ?? ""}
              companies={wsCompanies}
              onChange={(id) => onChange({ companyId: id })}
              onCreate={(name) => addCompany({ name, domain: "", workspaceId: contact.workspaceId })}
            />

            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              value={contact.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
            />
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">LinkedIn</label>
            <input
              value={contact.linkedin}
              onChange={(e) => onChange({ linkedin: e.target.value })}
              className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>


          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tags</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {contact.tags.map(t => <TagChip key={t} label={t} onRemove={() => removeTag(t)} />)}
            </div>
            <div className="mt-2 relative">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Type a tag and press Enter…"
                className="w-full h-8 px-2.5 text-[12px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
              />
              {tagInput && suggestions.length > 0 && (
                <div className="mt-1 border border-border rounded-md bg-popover overflow-hidden">
                  {suggestions.slice(0, 5).map(s => (
                    <button key={s} onClick={() => addTag(s)} className="w-full text-left px-2 py-1 text-[12px] hover:bg-muted">{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Eventos</label>
            {(() => {
              const links = eventsForContact(contact.id);
              const linkedIds = new Set(links.map(l => l.eventId));
              const available = events.filter(e => e.workspaceId === contact.workspaceId && !linkedIds.has(e.id));
              return (
                <div className="mt-2 space-y-1.5">
                  {links.length === 0 && (
                    <div className="text-[12px] text-muted-foreground italic">Sin eventos vinculados</div>
                  )}
                  {links.map(l => {
                    const ev = events.find(e => e.id === l.eventId);
                    if (!ev) return null;
                    return (
                      <div key={l.id} className="flex items-center gap-1.5 text-[12px] rounded-md border border-border bg-card px-2 py-1.5">
                        <span className="flex-1 truncate">{ev.name}</span>
                        <select
                          value={l.status}
                          onChange={(e) => { void updateEventContact(l.id, { status: e.target.value as EventContactStatus }); }}
                          className="h-6 px-1 text-[11px] bg-background border border-border rounded focus:outline-none focus:border-ring"
                        >
                          {(Object.keys(EVENT_CONTACT_STATUS_LABEL) as EventContactStatus[]).map(s => (
                            <option key={s} value={s}>{EVENT_CONTACT_STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                        <select
                          value={l.role}
                          onChange={(e) => { void updateEventContact(l.id, { role: e.target.value as EventContactRole }); }}
                          className="h-6 px-1 text-[11px] bg-background border border-border rounded focus:outline-none focus:border-ring"
                        >
                          {(Object.keys(EVENT_CONTACT_ROLE_LABEL) as EventContactRole[]).map(r => (
                            <option key={r} value={r}>{EVENT_CONTACT_ROLE_LABEL[r]}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => { void deleteEventContact(l.id); }}
                          className="size-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                          aria-label="Quitar vínculo"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                  <EventLinker
                    events={available}
                    onPick={(eventId) => { void addEventContact({ eventId, contactId: contact.id, status: "asistio", role: "asistente" }); }}
                  />
                </div>
              );
            })()}
          </div>



          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">History</label>
              <button
                onClick={() => setShowForm(s => !s)}
                className="h-7 px-2 inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground text-[11px] font-medium"
              >
                <Plus className="size-3" /> Log touchpoint
              </button>
            </div>

            {showForm && (
              <div className="rounded-md border border-border bg-card p-3 space-y-2 mb-3">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
                    className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                  />
                  <select
                    value={draft.channel}
                    onChange={(e) => setDraft(d => ({ ...d, channel: e.target.value as TouchpointChannel }))}
                    className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                  >
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea
                  value={draft.note}
                  onChange={(e) => setDraft(d => ({ ...d, note: e.target.value }))}
                  rows={3}
                  placeholder="Note…"
                  className="w-full px-2 py-1.5 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowForm(false)} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={save} className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium">Save</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {touchpoints.length === 0 && !showForm && (
                <div className="text-[12px] text-muted-foreground italic">No touchpoints logged yet.</div>
              )}
              {touchpoints.map(tp => {
                const Icon = channelIcon(tp.channel);
                return (
                  <div key={tp.id} className="rounded-md border border-border bg-card p-2.5 flex gap-2.5">
                    <div className="size-7 rounded-md bg-muted grid place-items-center shrink-0">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{tp.channel}</span>
                        <span className="tabular-nums">{tp.date}</span>
                      </div>
                      <div className="text-[12px] mt-0.5 whitespace-pre-wrap">{tp.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
    </div>
  );
}

export function ContactDetailDrawer({
  contact, onClose, onChange, touchpoints, onAddTouchpoint,
}: {
  contact: Contact | null;
  onClose: () => void;
  onChange: (patch: Partial<Contact>) => void;
  touchpoints: Touchpoint[];
  onAddTouchpoint: (tp: Touchpoint) => void;
}) {
  if (!contact) return null;
  return (
    <Sheet open={!!contact} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{contact.name}</SheetTitle>
        </SheetHeader>
        <ContactDetailContent
          contact={contact}
          onClose={onClose}
          onChange={onChange}
          touchpoints={touchpoints}
          onAddTouchpoint={onAddTouchpoint}
        />
      </SheetContent>
    </Sheet>
  );
}

