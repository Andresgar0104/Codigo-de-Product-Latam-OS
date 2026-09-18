import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { type Venue } from "@/lib/mock-data";
import { useStore } from "@/components/deals-context";
import { useWorkspace } from "@/components/workspace-context";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, MapPin, Users, Image as ImageIcon, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/venues")({
  head: () => ({ meta: [{ title: "Venues · Latam Leap" }] }),
  component: VenuesPage,
});

type VenueDraft = Omit<Venue, "id" | "workspaceId">;
const EMPTY_DRAFT: VenueDraft = {
  name: "", address: "", capacity: 100, ciudad: "", googleMapsUrl: "", notes: "",
  contactoPrincipal: { nombre: "", email: "", telefono: "" },
};

function VenuesPage() {
  const { workspace } = useWorkspace();
  const { venues, addVenue, updateVenue, deleteVenue } = useStore();

  const list = useMemo(() => venues.filter(v => v.workspaceId === workspace.id), [venues, workspace.id]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VenueDraft>(EMPTY_DRAFT);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? venues.find(v => v.id === activeId) ?? null : null;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(v =>
      v.name.toLowerCase().includes(s) ||
      (v.ciudad ?? "").toLowerCase().includes(s) ||
      (v.contactoPrincipal?.nombre ?? "").toLowerCase().includes(s)
    );
  }, [list, q]);

  function create() {
    if (!draft.name.trim()) return;
    const v: Venue = { id: `v_${Date.now()}`, workspaceId: workspace.id, ...draft };
    addVenue(v);
    setDraft(EMPTY_DRAFT);
    setOpen(false);
  }

  return (
    <AppShell>
      <PageHeader
        title="Venues"
        subtitle={`${list.length} venues`}
        actions={
          <button onClick={() => setOpen(true)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium">
            <Plus className="size-3.5" /> Nuevo venue
          </button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, ciudad o contacto..."
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveId(v.id)}
              className="text-left rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className="relative h-32 bg-muted grid place-items-center">
                {v.imageUrl
                  ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                  : <ImageIcon className="size-8 text-muted-foreground/50" />
                }
                <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur text-[10px] font-medium">
                  <Users className="size-3" /> {v.capacity}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[14px] font-bold leading-tight truncate">{v.name}</div>
                <div className="mt-1 text-[12px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  <span className="truncate">{v.ciudad || "Sin ciudad"}</span>
                  {v.capacity > 0 && <span className="ml-1">· cap {v.capacity}</span>}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-[12px] text-muted-foreground italic text-center py-8">
              Sin venues que coincidan.
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo venue</DialogTitle>
            <DialogDescription className="text-[12px]">
              Las fotos y documentos se gestionan desde el detalle del venue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormField label="Nombre *" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Ciudad" value={draft.ciudad ?? ""} onChange={v => setDraft(d => ({ ...d, ciudad: v }))} />
              <FormField label="Capacidad" type="number" value={String(draft.capacity)} onChange={v => setDraft(d => ({ ...d, capacity: parseInt(v) || 0 }))} />
            </div>
            <FormField label="Dirección" value={draft.address} onChange={v => setDraft(d => ({ ...d, address: v }))} />
            <FormField label="URL de Google Maps" value={draft.googleMapsUrl ?? ""} onChange={v => setDraft(d => ({ ...d, googleMapsUrl: v }))} placeholder="https://maps.app.goo.gl/..." />

            <div className="text-[11px] uppercase tracking-wider text-muted-foreground pt-2">Contacto principal (opcional)</div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nombre" value={draft.contactoPrincipal?.nombre ?? ""} onChange={v => setDraft(d => ({ ...d, contactoPrincipal: { ...(d.contactoPrincipal ?? { nombre: "", email: "", telefono: "" }), nombre: v } }))} />
              <FormField label="Email" value={draft.contactoPrincipal?.email ?? ""} onChange={v => setDraft(d => ({ ...d, contactoPrincipal: { ...(d.contactoPrincipal ?? { nombre: "", email: "", telefono: "" }), email: v } }))} />
            </div>
            <FormField label="Teléfono" value={draft.contactoPrincipal?.telefono ?? ""} onChange={v => setDraft(d => ({ ...d, contactoPrincipal: { ...(d.contactoPrincipal ?? { nombre: "", email: "", telefono: "" }), telefono: v } }))} />

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notas</label>
              <textarea
                value={draft.notes ?? ""}
                onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full px-3 py-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <button onClick={create} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium">Crear</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActiveId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {active && (
            <VenueEditor
              key={active.id}
              venue={active}
              onSave={(patch) => updateVenue(active.id, patch)}
              onDelete={() => {
                if (confirm("¿Borrar este venue?")) {
                  deleteVenue(active.id);
                  setActiveId(null);
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function VenueEditor({ venue, onSave, onDelete }: { venue: Venue; onSave: (patch: Partial<Venue>) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState<Venue>(venue);
  useEffect(() => { setDraft(venue); }, [venue]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{draft.name || "Venue"}</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-3">
        <FormField label="Nombre" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ciudad" value={draft.ciudad ?? ""} onChange={v => setDraft(d => ({ ...d, ciudad: v }))} />
          <FormField label="Capacidad" type="number" value={String(draft.capacity)} onChange={v => setDraft(d => ({ ...d, capacity: parseInt(v) || 0 }))} />
        </div>
        <FormField label="Dirección" value={draft.address} onChange={v => setDraft(d => ({ ...d, address: v }))} />
        <FormField label="URL de Google Maps" value={draft.googleMapsUrl ?? ""} onChange={v => setDraft(d => ({ ...d, googleMapsUrl: v }))} />

        <div className="text-[11px] uppercase tracking-wider text-muted-foreground pt-2">Contacto principal</div>
        <FormField label="Nombre" value={draft.contactoPrincipal?.nombre ?? ""} onChange={v => setDraft(d => ({ ...d, contactoPrincipal: { ...(d.contactoPrincipal ?? { nombre: "", email: "", telefono: "" }), nombre: v } }))} />
        <FormField label="Email" value={draft.contactoPrincipal?.email ?? ""} onChange={v => setDraft(d => ({ ...d, contactoPrincipal: { ...(d.contactoPrincipal ?? { nombre: "", email: "", telefono: "" }), email: v } }))} />
        <FormField label="Teléfono" value={draft.contactoPrincipal?.telefono ?? ""} onChange={v => setDraft(d => ({ ...d, contactoPrincipal: { ...(d.contactoPrincipal ?? { nombre: "", email: "", telefono: "" }), telefono: v } }))} />

        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notas</label>
          <textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full px-3 py-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12px] text-destructive hover:bg-destructive/10 rounded-md"
          >
            <Trash2 className="size-3.5" /> Borrar venue
          </button>
          <button
            onClick={() => onSave({
              name: draft.name,
              address: draft.address,
              capacity: draft.capacity,
              ciudad: draft.ciudad,
              googleMapsUrl: draft.googleMapsUrl,
              notes: draft.notes,
              contactoPrincipal: draft.contactoPrincipal,
            })}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
    </>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
      />
    </div>
  );
}
