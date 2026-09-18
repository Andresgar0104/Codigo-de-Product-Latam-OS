import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { useWorkspace } from "@/components/workspace-context";
import { useStore } from "@/components/deals-context";
import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import type { Company } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Empresas · Latam Leap" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { workspace } = useWorkspace();
  const { companies, contacts, addCompany, updateCompany, deleteCompany } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [forceCreate, setForceCreate] = useState(false);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const list = useMemo(
    () => companies.filter(c => c.workspaceId === workspace.id),
    [companies, workspace.id]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.domain ?? "").toLowerCase().includes(s)
    );
  }, [list, q]);

  const duplicate = useMemo(() => {
    const n = name.trim().toLowerCase();
    if (!n) return null;
    return list.find(c => c.name.trim().toLowerCase() === n) ?? null;
  }, [list, name]);

  function create() {
    if (!name.trim()) return;
    if (duplicate && !forceCreate) return;
    addCompany({ name: name.trim(), domain: domain.trim(), workspaceId: workspace.id });
    setName(""); setDomain(""); setOpen(false); setForceCreate(false);
  }

  return (
    <AppShell>
      <PageHeader
        title="Empresas"
        subtitle={`${list.length} empresas`}
        actions={
          <button onClick={() => { setOpen(true); setForceCreate(false); }} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium">
            <Plus className="size-3.5" /> Nueva empresa
          </button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o dominio…"
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
          />
        </div>

        <div className="space-y-2">
          {filtered.map(c => {
            const count = contacts.filter(x => x.companyId === c.id).length;
            return (
              <div
                key={c.id}
                onClick={() => setActiveCompany(c)}
                className="rounded-md border border-border bg-card px-4 py-3 hover:border-primary/40 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[14px] font-bold leading-tight">{c.name}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{c.domain || "sin dominio"}</div>
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">{count} contacto{count === 1 ? "" : "s"}</div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-[12px] text-muted-foreground italic text-center py-8">
              Sin empresas que coincidan.
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setName(""); setDomain(""); setForceCreate(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nombre *</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setForceCreate(false); }}
                className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
              {duplicate && (
                <div className="mt-1.5 text-[11px] text-amber-400">
                  Ya existe una empresa con este nombre ("{duplicate.name}").
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Dominio</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="ejemplo.com"
                className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
            </div>
          </div>
          <DialogFooter>
            {duplicate && !forceCreate ? (
              <button onClick={() => setForceCreate(true)} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-muted">
                Crear de todas formas
              </button>
            ) : (
              <button onClick={create} disabled={!name.trim()} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-50">Crear</button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditCompanySheet
        company={activeCompany}
        onClose={() => setActiveCompany(null)}
        contactsCount={activeCompany ? contacts.filter(c => c.companyId === activeCompany.id).length : 0}
        otherCompanies={activeCompany ? list.filter(c => c.id !== activeCompany.id) : []}
        onSave={(patch) => activeCompany && updateCompany(activeCompany.id, patch)}
        onDelete={(mergeIntoId) => {
          if (!activeCompany) return;
          deleteCompany(activeCompany.id, mergeIntoId);
          setActiveCompany(null);
        }}
      />
    </AppShell>
  );
}

function EditCompanySheet({
  company, onClose, contactsCount, otherCompanies, onSave, onDelete,
}: {
  company: Company | null;
  onClose: () => void;
  contactsCount: number;
  otherCompanies: Company[];
  onSave: (patch: { name: string; domain: string }) => void;
  onDelete: (mergeIntoId?: string) => void;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [mergeId, setMergeId] = useState("");

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDomain(company.domain ?? "");
      setDeleting(false);
      setMergeId("");
    }
  }, [company]);

  if (!company) return null;

  function save() {
    onSave({ name: name.trim(), domain: domain.trim() });
    onClose();
  }

  function confirmDelete() {
    if (contactsCount > 0) {
      if (!mergeId) return;
      onDelete(mergeId);
    } else {
      onDelete();
    }
  }

  return (
    <Sheet open={!!company} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar empresa</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Dominio</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="ejemplo.com"
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>
          <div className="text-[11px] text-muted-foreground">{contactsCount} contacto{contactsCount === 1 ? "" : "s"} en esta empresa</div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={!name.trim()} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-50">Guardar</button>
            <button onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-muted">Cancelar</button>
          </div>

          <div className="pt-6 border-t border-border">
            {!deleting ? (
              <button onClick={() => setDeleting(true)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-[12px] text-destructive hover:bg-destructive/10">
                <Trash2 className="size-3.5" /> Borrar empresa
              </button>
            ) : (
              <div className="space-y-3">
                {contactsCount > 0 ? (
                  <>
                    <div className="text-[12px]">Esta empresa tiene {contactsCount} contactos. Selecciona una empresa a la que fusionarlos antes de borrar.</div>
                    <select
                      value={mergeId}
                      onChange={(e) => setMergeId(e.target.value)}
                      className="w-full h-9 px-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
                    >
                      <option value="">— Selecciona empresa —</option>
                      {otherCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={confirmDelete} disabled={!mergeId} className="h-9 px-3 rounded-md bg-destructive text-destructive-foreground text-[12px] font-medium disabled:opacity-50">
                        Fusionar y borrar
                      </button>
                      <button onClick={() => setDeleting(false)} className="h-9 px-3 rounded-md border border-border text-[12px] hover:bg-muted">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[12px]">¿Borrar esta empresa?</div>
                    <div className="flex gap-2">
                      <button onClick={confirmDelete} className="h-9 px-3 rounded-md bg-destructive text-destructive-foreground text-[12px] font-medium">Borrar</button>
                      <button onClick={() => setDeleting(false)} className="h-9 px-3 rounded-md border border-border text-[12px] hover:bg-muted">Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
