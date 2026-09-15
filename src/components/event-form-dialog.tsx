import { useEffect, useState } from "react";
import type { Event } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export type EventFormData = {
  name: string;
  date: string;
  time?: string;
  formato: string;
  target: number;
  descripcion: string;
  audienciaObjetivo: string;
  landingUrl: string;
  status: Event["status"];
};

type Draft = {
  name: string;
  date: string;
  time: string;
  formato: string;
  target: string;
  unlimited: boolean;
  descripcion: string;
  audienciaObjetivo: string;
  landingUrl: string;
};

const EMPTY_DRAFT: Draft = {
  name: "", date: "", time: "", formato: "presencial",
  target: "", unlimited: false, descripcion: "",
  audienciaObjetivo: "", landingUrl: "",
};

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function EventFormDialog({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<Event>;
  title: string;
  submitLabel: string;
  onSubmit: (data: EventFormData) => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  useEffect(() => {
    if (open) {
      setDraft(initial ? {
        name: initial.name ?? "",
        date: initial.date ?? "",
        time: initial.time ?? "",
        formato: initial.formato ?? "presencial",
        target: initial.target != null && initial.target !== 0 ? String(initial.target) : "",
        unlimited: initial.target === 0,
        descripcion: initial.descripcion ?? "",
        audienciaObjetivo: initial.audienciaObjetivo ?? "",
        landingUrl: initial.landingUrl ?? "",
      } : EMPTY_DRAFT);
    }
  }, [open, initial]);

  function submit() {
    if (!draft.name.trim() || !draft.date) return;
    const target = draft.unlimited ? 0 : (parseInt(draft.target) || 0);
    const isPast = new Date(draft.date) < todayMidnight();
    onSubmit({
      name: draft.name.trim(),
      date: draft.date,
      time: draft.time || undefined,
      formato: draft.formato,
      target,
      descripcion: draft.descripcion,
      audienciaObjetivo: draft.audienciaObjetivo.trim(),
      landingUrl: draft.landingUrl.trim(),
      status: isPast ? "past" : "upcoming",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nombre *">
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha *">
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
                className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
            </Field>
            <Field label="Hora">
              <input
                type="time"
                value={draft.time}
                onChange={(e) => setDraft(d => ({ ...d, time: e.target.value }))}
                className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
              />
            </Field>
          </div>
          <Field label="Formato">
            <select
              value={draft.formato}
              onChange={(e) => setDraft(d => ({ ...d, formato: e.target.value }))}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            >
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="híbrido">Híbrido</option>
            </select>
          </Field>
          <Field label="Capacidad">
            <div className="mt-1 flex items-center gap-3">
              <input
                type="number"
                value={draft.target}
                disabled={draft.unlimited}
                onChange={(e) => setDraft(d => ({ ...d, target: e.target.value }))}
                className="flex-1 h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring disabled:opacity-50"
              />
              <label className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.unlimited}
                  onChange={(e) => setDraft(d => ({ ...d, unlimited: e.target.checked }))}
                  className="size-3.5"
                />
                Sin límite
              </label>
            </div>
          </Field>
          <Field label="Audiencia objetivo">
            <input
              value={draft.audienciaObjetivo}
              onChange={(e) => setDraft(d => ({ ...d, audienciaObjetivo: e.target.value }))}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </Field>
          <Field label="Landing / URL Luma">
            <input
              value={draft.landingUrl}
              onChange={(e) => setDraft(d => ({ ...d, landingUrl: e.target.value }))}
              placeholder="https://lu.ma/..."
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </Field>
          <Field label="Descripción">
            <textarea
              rows={3}
              value={draft.descripcion}
              onChange={(e) => setDraft(d => ({ ...d, descripcion: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </Field>
        </div>
        <DialogFooter>
          <button onClick={submit} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium">
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
