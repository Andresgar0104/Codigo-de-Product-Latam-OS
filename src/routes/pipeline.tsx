import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { ACTIVE_STAGES, stageOrder, stageLabels, type Deal, type Stage, type Contact, type TouchpointChannel } from "@/lib/mock-data";
import { useWorkspace } from "@/components/workspace-context";
import { useStore } from "@/components/deals-context";
import { CompanyCombobox } from "@/components/company-combobox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronDown, Trash2, Search, Plus, CalendarDays } from "lucide-react";

const TP_CHANNELS: TouchpointChannel[] = ["Email", "LinkedIn", "Call", "WhatsApp", "Meeting", "Evento", "Notas"];

const AVATAR_TINTS = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
];

function tintFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function getInitials(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "—";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2) || "—";
}

function formatAmount(n?: number | null): string {
  if (n == null || n <= 0) return "";
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

const STAGE_DOT: Record<Stage, string> = {
  contacted: "bg-slate-400",
  engaged: "bg-blue-500",
  meeting: "bg-violet-500",
  proposal: "bg-teal-500",
  won: "bg-emerald-500",
  lost: "bg-rose-500",
};

export const Route = createFileRoute("/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline · Latam Leap" }] }),
  component: Pipeline,
});

function Pipeline() {
  const { workspace } = useWorkspace();
  const { deals, contacts, companies, events, eventsForContact, updateDeal } = useStore();
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const [showLost, setShowLost] = useState(false);

  const wsDeals = deals.filter(d => d.workspaceId === workspace.id);
  const openDeal = deals.find(d => d.id === openDealId) ?? null;
  const lostCount = wsDeals.filter(d => d.stage === "lost").length;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!stageOrder.includes(overId as Stage)) return;
    updateDeal(String(active.id), { stage: overId as Stage });
  }

  const visibleStages: Stage[] = showLost ? [...ACTIVE_STAGES, "lost"] : ACTIVE_STAGES;

  return (
    <AppShell>
      <PageHeader
        title="Pipeline"
        subtitle="Oportunidades activas por etapa"
        actions={
          <button
            onClick={() => setShowLost(s => !s)}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border text-[12px] hover:bg-muted"
          >
            {showLost ? "Ocultar perdidos" : `Ver perdidos (${lostCount})`}
            <ChevronDown className={`size-3.5 transition-transform ${showLost ? "rotate-180" : ""}`} />
          </button>
        }
      />
      <div className="p-4 overflow-auto">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 min-w-max pb-4">
            {visibleStages.map(stage => {
              const items = wsDeals.filter(d => d.stage === stage);
              const total = items.reduce((sum, d) => sum + (d.value ?? 0), 0);
              return (
                <Column key={stage} stage={stage} count={items.length} total={total} muted={stage === "lost"}>
                  {items.map(d => {
                    const contact = contacts.find(c => c.id === d.contactId);
                    const company = companies.find(co => co.id === contact?.companyId);
                    const links = eventsForContact(d.contactId);
                    const originEvent = links[0] ? events.find(e => e.id === links[0].eventId) : undefined;
                    return (
                      <DealCard
                        key={d.id}
                        deal={d}
                        contactName={contact?.name ?? "—"}
                        contactTitle={contact?.title ?? ""}
                        companyName={company?.name ?? ""}
                        originEventName={originEvent?.name ?? ""}
                        onOpen={() => setOpenDealId(d.id)}
                      />
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-[11px] text-muted-foreground italic text-center py-4">Sin oportunidades.</div>
                  )}
                </Column>
              );
            })}
          </div>
        </DndContext>
      </div>

      <DealDetailSheet deal={openDeal} onClose={() => setOpenDealId(null)} />
    </AppShell>
  );
}

function Column({ stage, count, total, muted, children }: { stage: Stage; count: number; total: number; muted?: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const formatted = formatAmount(total);
  return (
    <div className={`w-72 shrink-0 rounded-lg border flex flex-col ${muted ? "bg-muted/10 border-border/60" : "bg-muted/30 border-border"}`}>
      <div className={`px-3 py-2 border-b border-border ${muted ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${STAGE_DOT[stage]}`} />
          <span className="text-[12px] font-medium">{stageLabels[stage]}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{count}</span>
        </div>
        {formatted && (
          <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5 pl-3.5">{formatted} MXN</div>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`p-2 space-y-2 flex-1 min-h-[200px] transition-colors ${isOver ? "bg-primary/5" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function DealCard({
  deal, contactName, contactTitle, companyName, originEventName, onOpen,
}: {
  deal: Deal;
  contactName: string;
  contactTitle: string;
  companyName: string;
  originEventName: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : {};

  const subtitle = [contactTitle, companyName].filter(Boolean).join(" · ");
  const amount = formatAmount(deal.value);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border border-border bg-card p-2.5 hover:border-primary/40 transition-colors ${isDragging ? "opacity-70" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={onOpen}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5">
          <div className={`size-[30px] shrink-0 rounded-full flex items-center justify-center text-[11px] font-medium ${tintFor(deal.contactId || deal.id)}`}>
            {getInitials(contactName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium truncate">{contactName}</div>
            <div className="text-[11px] text-muted-foreground truncate">{subtitle || "—"}</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0 text-[11px] text-muted-foreground">
            <CalendarDays className="size-3 shrink-0" />
            <span className="truncate">{originEventName || "—"}</span>
          </div>
          {amount ? (
            <span className="text-[12px] font-medium tabular-nums shrink-0">{amount}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground shrink-0">sin monto</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DealDetailSheet({ deal, onClose }: { deal: Deal | null; onClose: () => void }) {
  const { contacts, companies, updateDeal, deleteDeal, updateContact, addContact, addCompany, getTouchpoints, addTouchpoint } = useStore();
  const [editing, setEditing] = useState(false);
  const [bpOpen, setBpOpen] = useState(false);
  const [bpQuery, setBpQuery] = useState("");
  const [showNewBp, setShowNewBp] = useState(false);
  const [showTpForm, setShowTpForm] = useState(false);
  const [tpDraft, setTpDraft] = useState<{ date: string; channel: TouchpointChannel; note: string }>({
    date: new Date().toISOString().slice(0, 10),
    channel: "Notas",
    note: "",
  });

  if (!deal) return null;
  const contact = contacts.find(c => c.id === deal.contactId);
  const company = contact ? companies.find(c => c.id === contact.companyId) : undefined;
  const wsContacts = contacts.filter(c => c.workspaceId === deal.workspaceId);
  const wsCompanies = companies.filter(c => c.workspaceId === deal.workspaceId);

  return (
    <Sheet open={!!deal} onOpenChange={(o) => { if (!o) { onClose(); setEditing(false); setBpOpen(false); setShowNewBp(false); setBpQuery(""); } }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{contact?.name ?? "—"}</SheetTitle>
          <div className="text-[12px] text-muted-foreground">
            {contact?.title || "—"} · {company?.name ?? "—"}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Etapa</label>
            <select
              value={deal.stage}
              onChange={(e) => updateDeal(deal.id, { stage: e.target.value as Stage })}
              className="mt-1 w-full h-9 px-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            >
              {stageOrder.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}
            </select>
          </div>

          <MontoEditor deal={deal} onSave={(v) => updateDeal(deal.id, { value: v })} />


          {contact && (
            <ContactSection
              contact={contact}
              editing={editing}
              setEditing={setEditing}
              onSave={(patch) => updateContact(contact.id, patch)}
            />
          )}

          <div className="rounded-md border border-border bg-card">
            <button
              onClick={() => setBpOpen(o => !o)}
              className="w-full px-3 py-2 flex items-center justify-between text-[12px] font-medium"
            >
              <span>¿No es el buyer persona?</span>
              <ChevronDown className={`size-3.5 transition-transform ${bpOpen ? "rotate-180" : ""}`} />
            </button>
            {bpOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
                <div className="text-[11px] text-muted-foreground">El contacto anterior seguirá en Contacts sin este deal.</div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    value={bpQuery}
                    onChange={(e) => setBpQuery(e.target.value)}
                    placeholder="Buscar contacto…"
                    className="w-full h-9 pl-8 pr-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                  />
                </div>
                <div className="max-h-48 overflow-auto rounded-md border border-border bg-background">
                  {wsContacts
                    .filter(c => c.id !== deal.contactId && (!bpQuery.trim() || c.name.toLowerCase().includes(bpQuery.toLowerCase())))
                    .slice(0, 20)
                    .map(c => {
                      const co = companies.find(x => x.id === c.companyId);
                      return (
                        <button
                          key={c.id}
                          onClick={() => { updateDeal(deal.id, { contactId: c.id }); setBpOpen(false); setBpQuery(""); }}
                          className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted"
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.title} · {co?.name ?? "—"}</div>
                        </button>
                      );
                    })}
                </div>
                <button
                  onClick={() => setShowNewBp(s => !s)}
                  className="text-[12px] text-primary hover:underline"
                >
                  {showNewBp ? "− Cancelar nuevo contacto" : "+ Crear nuevo contacto"}
                </button>
                {showNewBp && (
                  <NewContactForm
                    workspaceId={deal.workspaceId}
                    companies={wsCompanies}
                    onCreate={(c) => {
                      addContact(c);
                      updateDeal(deal.id, { contactId: c.id });
                      setBpOpen(false);
                      setShowNewBp(false);
                    }}
                    onCreateCompany={(name) => addCompany({ name, domain: "", workspaceId: deal.workspaceId })}
                  />
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Historial</label>
              <button
                onClick={() => setShowTpForm(s => !s)}
                className="h-7 px-2 inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground text-[11px] font-medium"
              >
                <Plus className="size-3" /> Log touchpoint
              </button>
            </div>
            {showTpForm && (
              <div className="rounded-md border border-border bg-card p-3 space-y-2 mb-3">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tpDraft.date}
                    onChange={(e) => setTpDraft(d => ({ ...d, date: e.target.value }))}
                    className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                  />
                  <select
                    value={tpDraft.channel}
                    onChange={(e) => setTpDraft(d => ({ ...d, channel: e.target.value as TouchpointChannel }))}
                    className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                  >
                    {TP_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea
                  value={tpDraft.note}
                  onChange={(e) => setTpDraft(d => ({ ...d, note: e.target.value }))}
                  rows={3}
                  placeholder="Note…"
                  className="w-full px-2 py-1.5 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowTpForm(false)} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                  <button
                    onClick={() => {
                      addTouchpoint({ contactId: deal.contactId, channel: tpDraft.channel, date: tpDraft.date, note: tpDraft.note });
                      setTpDraft({ date: new Date().toISOString().slice(0, 10), channel: "Notas", note: "" });
                      setShowTpForm(false);
                    }}
                    className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {getTouchpoints(deal.contactId).length === 0 && !showTpForm && (
                <div className="text-[12px] text-muted-foreground italic">Sin touchpoints registrados.</div>
              )}
              {getTouchpoints(deal.contactId).map(tp => (
                <div key={tp.id} className="rounded-md border border-border bg-card p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{tp.channel}</span>
                    <span className="tabular-nums">{tp.date}</span>
                  </div>
                  <div className="text-[12px] mt-0.5 whitespace-pre-wrap">{tp.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            {deal.stage !== "lost" ? (
              <button
                onClick={() => { updateDeal(deal.id, { stage: "lost" }); onClose(); }}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-destructive/10 text-destructive text-[12px] font-medium hover:bg-destructive/15"
              >
                Marcar como perdido
              </button>
            ) : (
              <button
                onClick={() => { updateDeal(deal.id, { stage: "contacted" }); onClose(); }}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium"
              >
                Reactivar
              </button>
            )}
            <div>
              <button
                onClick={() => {
                  if (window.confirm("¿Eliminar este deal permanentemente?")) {
                    deleteDeal(deal.id);
                    onClose();
                  }
                }}
                className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" /> Eliminar definitivamente
              </button>
            </div>
            {deal.stage !== "lost" && (
              <div className="text-[11px] text-muted-foreground">El contacto seguirá disponible en Contacts.</div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContactSection({
  contact, editing, setEditing, onSave,
}: {
  contact: Contact;
  editing: boolean;
  setEditing: (b: boolean) => void;
  onSave: (patch: Partial<Contact>) => void;
}) {
  const [draft, setDraft] = useState({ name: contact.name, title: contact.title, email: contact.email, linkedin: contact.linkedin });

  function startEdit() {
    setDraft({ name: contact.name, title: contact.title, email: contact.email, linkedin: contact.linkedin });
    setEditing(true);
  }

  function save() {
    onSave(draft);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contacto</label>
        {!editing && (
          <button onClick={startEdit} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            Editar contacto
          </button>
        )}
      </div>
      {!editing ? (
        <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
          <div className="text-[13px] font-medium">{contact.name}</div>
          <div className="text-[12px] text-muted-foreground">{contact.title || "—"}</div>
          <div className="text-[12px]">{contact.email || <span className="text-muted-foreground italic">sin email</span>}</div>
          <div className="text-[12px] truncate">{contact.linkedin || <span className="text-muted-foreground italic">sin linkedin</span>}</div>
        </div>
      ) : (
        <div className="space-y-2">
          <input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Nombre" className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring" />
          <input value={draft.title} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Puesto" className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring" />
          <input value={draft.email} onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))} placeholder="Email" className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring" />
          <input value={draft.linkedin} onChange={(e) => setDraft(d => ({ ...d, linkedin: e.target.value }))} placeholder="LinkedIn" className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring" />
          <div className="flex gap-2">
            <button onClick={save} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium">Guardar</button>
            <button onClick={() => setEditing(false)} className="h-8 px-3 rounded-md border border-border text-[12px] hover:bg-muted">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewContactForm({
  workspaceId, companies, onCreate, onCreateCompany,
}: {
  workspaceId: string;
  companies: { id: string; name: string; domain: string }[];
  onCreate: (c: Contact) => void;
  onCreateCompany: (name: string) => { id: string };
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");

  function submit() {
    if (!name.trim()) return;
    onCreate({
      id: `ct_${Date.now()}`,
      name: name.trim(),
      title: title.trim(),
      email: email.trim(),
      linkedin: "",
      companyId,
      workspaceId,

      tags: [],
      lastTouch: "now",
    });
  }

  return (
    <div className="space-y-2 mt-2 rounded-md border border-border bg-background p-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *" className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring" />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Puesto" className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring" />
      <CompanyCombobox
        value={companyId}
        companies={companies as any}
        onChange={setCompanyId}
        onCreate={(n) => onCreateCompany(n) as any}
      />
      <button onClick={submit} disabled={!name.trim()} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50">
        Crear y asignar
      </button>
    </div>
  );
}

function MontoEditor({ deal, onSave }: { deal: Deal; onSave: (v: number | undefined) => void }) {
  const [text, setText] = useState(deal.value != null ? String(deal.value) : "");
  useEffect(() => { setText(deal.value != null ? String(deal.value) : ""); }, [deal.id, deal.value]);

  function commit() {
    const trimmed = text.trim();
    if (trimmed === "") {
      if (deal.value != null) onSave(undefined);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    if (n !== deal.value) onSave(n);
  }

  const preview = formatAmount(deal.value);

  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Monto (MXN)</label>
      <input
        type="number"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
        placeholder="0"
        className="mt-1 w-full h-9 px-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
      />
      {preview && (
        <div className="text-[11px] text-muted-foreground mt-1">{preview}</div>
      )}
    </div>
  );
}
