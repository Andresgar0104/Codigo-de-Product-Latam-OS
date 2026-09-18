import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader, TagChip } from "@/components/ui-bits";
import { TAG_OPTIONS, type Contact } from "@/lib/mock-data";
import { useWorkspace } from "@/components/workspace-context";
import { useDeals, useStore } from "@/components/deals-context";
import { useEffect, useMemo, useState } from "react";
import { Filter, X, UserRound } from "lucide-react";
import { ContactDetailDrawer, ContactDetailContent } from "@/components/contact-detail-drawer";
import { CompanyCombobox } from "@/components/company-combobox";
import { CsvImportModal } from "@/components/csv-import-modal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

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

function initialsFor(c: Contact) {
  const f = (c.firstName || "").trim();
  const l = (c.lastName || "").trim();
  if (f || l) return ((f[0] || "") + (l[0] || "")).toUpperCase() || "?";
  return (c.name || "?").trim().slice(0, 2).toUpperCase();
}

function useIsLargeScreen() {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isLg;
}


export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts · Latam Leap" }] }),
  component: Contacts,
});

function Contacts() {
  const { workspace } = useWorkspace();
  const { addDeal, dealForContact } = useDeals();
  const { contacts, addContact, updateContact, companies, addCompany, getTouchpoints, addTouchpoint } = useStore();
  const [q, setQ] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const isLg = useIsLargeScreen();

  const rows = useMemo(() => contacts.filter(c => {
    if (c.workspaceId !== workspace.id) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (tagFilters.length && !tagFilters.every(t => c.tags.includes(t))) return false;
    return true;
  }), [contacts, q, tagFilters, workspace.id]);

  const total = contacts.filter(c => c.workspaceId === workspace.id).length;
  const active = contacts.find(c => c.id === openId) ?? null;

  return (
    <AppShell>
      <div className="h-full flex flex-col min-h-0">
        <PageHeader
          title="Contacts"
          subtitle={`${rows.length} of ${total} leads`}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="h-8 px-3 rounded-md border border-border bg-background text-[12px] font-medium hover:bg-muted"
              >
                Importar CSV
              </button>
              <button
                onClick={() => setShowNew(true)}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium"
              >
                + Add contact
              </button>
            </div>
          }
        />
        <div className="px-6 py-3 border-b border-border flex items-center gap-2 flex-wrap relative shrink-0">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name…"
            className="h-7 px-2.5 text-[12px] bg-muted/40 border border-border rounded-md focus:outline-none focus:border-ring w-56"
          />
          {tagFilters.map(t => (
            <span key={t} className="inline-flex items-center gap-1 h-7 px-2 text-[11px] bg-muted border border-border rounded-md">
              tag: {t}
              <button onClick={() => setTagFilters(prev => prev.filter(x => x !== t))} className="opacity-60 hover:opacity-100"><X className="size-3" /></button>
            </span>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowFilter(s => !s)}
              className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground border border-dashed border-border rounded-md hover:bg-muted">
              <Filter className="size-3" /> + Add filter
            </button>
            {showFilter && (
              <div className="absolute z-20 top-full mt-1 left-0 w-56 rounded-md border border-border bg-popover shadow-lg p-1">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Filter by tag</div>
                {TAG_OPTIONS.map(t => {
                  const on = tagFilters.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setTagFilters(prev => on ? prev.filter(x => x !== t) : [...prev, t])}
                      className={`w-full text-left px-2 py-1.5 text-[12px] rounded hover:bg-muted ${on ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {on ? "✓ " : "  "}{t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* LEFT — list */}
          <div className="w-full lg:w-[320px] lg:shrink-0 lg:border-r border-border overflow-y-auto">
            {rows.map(c => {
              const co = c.companyId ? companies.find(x => x.id === c.companyId) : undefined;
              const existing = dealForContact(c.id, workspace.id);
              const selected = c.id === openId;
              const meta = [c.title, co?.name].filter(Boolean).join(" · ");
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  className={`w-full flex items-center gap-3 pl-3 pr-3 py-2.5 text-left border-b border-border/50 transition-colors ${
                    selected
                      ? "bg-muted border-l-2 border-l-primary pl-[10px]"
                      : "border-l-2 border-l-transparent hover:bg-muted/40"
                  }`}
                >
                  <span className={`size-[34px] rounded-full grid place-items-center text-[11px] font-semibold shrink-0 ${tintFor(c.id)}`}>
                    {initialsFor(c)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium truncate">{c.name}</span>
                    <span className="block text-[12px] text-muted-foreground truncate">{meta || "—"}</span>
                  </span>
                  {existing && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" aria-label="En pipeline" />
                  )}
                </button>
              );
            })}
            {rows.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground italic">Sin contactos en esta cuenta.</div>
            )}
          </div>

          {/* RIGHT — detail panel (lg+) */}
          {isLg && (
            <div className="flex-1 min-w-0 overflow-y-auto">
              {active ? (
                <div className="px-6 py-5 max-w-2xl">
                  <ContactDetailContent
                    contact={active}
                    onClose={() => setOpenId(null)}
                    onChange={(patch) => updateContact(active.id, patch)}
                    touchpoints={getTouchpoints(active.id)}
                    onAddTouchpoint={(tp) => addTouchpoint({ contactId: tp.contactId, channel: tp.channel, date: tp.date, note: tp.note })}
                  />
                </div>
              ) : (
                <div className="h-full grid place-items-center text-center px-6">
                  <div>
                    <UserRound className="size-10 mx-auto text-muted-foreground/50" />
                    <div className="mt-3 text-[13px] font-medium text-muted-foreground">Selecciona un contacto</div>
                    <div className="text-[12px] text-muted-foreground/70">Elige a alguien de la lista para ver su detalle</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile / <lg — fall back to Sheet overlay */}
      {!isLg && (
        <ContactDetailDrawer
          contact={active}
          onClose={() => setOpenId(null)}
          onChange={(patch) => active && updateContact(active.id, patch)}
          touchpoints={active ? getTouchpoints(active.id) : []}
          onAddTouchpoint={(tp) => addTouchpoint({ contactId: tp.contactId, channel: tp.channel, date: tp.date, note: tp.note })}
        />
      )}

      <NewContactDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        workspaceId={workspace.id}
        companies={companies.filter(c => c.workspaceId === workspace.id)}
        onCreateCompany={(name) => addCompany({ name, domain: "", workspaceId: workspace.id })}
        onCreate={addContact}
      />

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        workspaceId={workspace.id}
      />
    </AppShell>
  );

}

function NewContactDialog({
  open, onClose, workspaceId, companies, onCreateCompany, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  companies: import("@/lib/mock-data").Company[];
  onCreateCompany: (name: string) => import("@/lib/mock-data").Company;
  onCreate: (c: Contact) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [puesto, setPuesto] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  function reset() {
    setNombre(""); setApellido(""); setEmail(""); setPuesto("");
    setCompanyId(""); setTags([]); setTagInput("");
  }

  function addTag(t: string) {
    const tag = t.trim();
    if (!tag || tags.includes(tag)) return;
    setTags(prev => [...prev, tag]);
    setTagInput("");
  }

  function submit() {
    if (!nombre.trim()) return;
    const first = nombre.trim();
    const last = apellido.trim();
    const c: Contact = {
      id: `ct_${Date.now()}`,
      name: `${first} ${last}`.trim(),
      firstName: first,
      lastName: last,
      title: puesto.trim(),
      email: email.trim(),
      linkedin: "",
      companyId,

      workspaceId,
      tags,
      lastTouch: "now",
    };
    onCreate(c);
    reset();
    onClose();
  }


  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva persona</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nombre *</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Apellido</label>
              <input
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Puesto</label>
            <input
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Empresa</label>
            <div className="mt-1">
              <CompanyCombobox
                value={companyId}
                companies={companies}
                onChange={setCompanyId}
                onCreate={(name) => onCreateCompany(name)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tags</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {tags.map(t => <TagChip key={t} label={t} onRemove={() => setTags(prev => prev.filter(x => x !== t))} />)}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
              placeholder="Type a tag and press Enter…"
              className="mt-2 w-full h-8 px-2.5 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={submit}
            disabled={!nombre.trim()}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
