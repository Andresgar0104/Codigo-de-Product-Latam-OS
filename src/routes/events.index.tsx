import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { type Event } from "@/lib/mock-data";
import { useWorkspace } from "@/components/workspace-context";
import { useStore } from "@/components/deals-context";
import { MapPin, Users, Video, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { EventFormDialog } from "@/components/event-form-dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/events/")({
  head: () => ({ meta: [{ title: "Events · Taltics" }] }),
  component: Events,
});

const DEFAULT_COVER = "linear-gradient(135deg, oklch(0.72 0.19 245), oklch(0.5 0.18 280))";

type Tab = "upcoming" | "past";

function Events() {
  const { workspace } = useWorkspace();
  const { events, venues, eventContacts, contacts, addEvent, updateEvent, deleteEvent } = useStore();

  const wsEvents = events.filter(e => e.workspaceId === workspace.id);
  const [tab, setTab] = useState<Tab>("upcoming");

  const sorted = useMemo(() => {
    const list = wsEvents.filter(e => tab === "past" ? e.status === "past" : e.status !== "past");
    return list.sort((a, b) => {
      const ka = `${a.date} ${a.time ?? "00:00"}`;
      const kb = `${b.date} ${b.time ?? "00:00"}`;
      return tab === "upcoming" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
  }, [wsEvents, tab]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  function startNew() { setEditing(null); setOpen(true); }
  function startEdit(e: Event) { setEditing(e); setOpen(true); }
  function onDelete(id: string) { if (confirm("¿Borrar este evento?")) deleteEvent(id); }

  return (
    <AppShell>
      <PageHeader
        title="Events"
        subtitle={`${wsEvents.length} eventos`}
        actions={
          <div className="flex items-center gap-2">
            <SegmentedTabs value={tab} onChange={setTab} />
            <button onClick={startNew} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium">+ New event</button>
          </div>
        }
      />

      <div key={workspace.id} className="px-6 py-8 max-w-4xl mx-auto">
        {sorted.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-[13px] text-muted-foreground">
              {tab === "upcoming" ? "No hay eventos próximos" : "No hay eventos pasados"}
            </div>
            <button onClick={startNew} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium">+ New event</button>
          </div>
        ) : (
          <ol className="relative">
            {/* dashed spine */}
            <span aria-hidden className="absolute left-[52px] top-2 bottom-2 border-l border-dashed border-border" />
            {sorted.map(e => (
              <TimelineRow
                key={e.id}
                e={e}
                venueName={e.venueId ? venues.find(v => v.id === e.venueId)?.name : undefined}
                linkedContactIds={eventContacts.filter(ec => ec.eventId === e.id).map(ec => ec.contactId)}
                contacts={contacts}
                onEdit={startEdit}
                onDelete={onDelete}
              />
            ))}
          </ol>
        )}
      </div>

      <EventFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? undefined}
        title={editing ? "Editar evento" : "Nuevo evento"}
        submitLabel={editing ? "Guardar cambios" : "Crear evento"}
        onSubmit={(data) => {
          if (editing) {
            updateEvent(editing.id, data);
          } else {
            addEvent({
              id: `ev_${Date.now()}`,
              ...data,
              workspaceId: workspace.id,
              city: "",
              registrations: 0,
              cover: DEFAULT_COVER,
            });
          }
          setOpen(false);
          setEditing(null);
        }}
      />
    </AppShell>
  );
}

function SegmentedTabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
      {(["upcoming", "past"] as const).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={
            "h-7 px-3 rounded text-[12px] font-medium transition-colors " +
            (value === t
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {t === "upcoming" ? "Upcoming" : "Past"}
        </button>
      ))}
    </div>
  );
}

function formatMonthDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatWeekday(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}
function formatTime12h(time?: string) {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? "")
    .join("");
}

function TimelineRow({
  e, venueName, linkedContactIds, contacts, onEdit, onDelete,
}: {
  e: Event;
  venueName?: string;
  linkedContactIds: string[];
  contacts: { id: string; name: string }[];
  onEdit: (e: Event) => void;
  onDelete: (id: string) => void;
}) {
  const time12 = formatTime12h(e.time);
  const linked = linkedContactIds
    .map(id => contacts.find(c => c.id === id))
    .filter((c): c is { id: string; name: string } => Boolean(c));
  const shown = linked.slice(0, 4);
  const remaining = Math.max(linked.length - shown.length, 0);

  const locationLabel = venueName ?? (e.city || (e.formato === "virtual" ? "Virtual" : null));
  const LocationIcon = e.formato === "virtual" && !venueName && !e.city ? Video : MapPin;

  return (
    <li className="relative flex gap-6 py-5 first:pt-2 last:pb-2">
      {/* date rail */}
      <div className="w-[88px] shrink-0 pt-1 relative">
        <div className="text-[15px] font-semibold leading-tight">{formatMonthDay(e.date)}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{formatWeekday(e.date)}</div>
        {/* dot on the spine */}
        <span aria-hidden className="absolute top-2 -right-[36px] size-2 rounded-full bg-muted-foreground/70 ring-4 ring-background" />
      </div>

      {/* card */}
      <div className="relative flex-1 group">
        <Link
          to="/events/$eventId"
          params={{ eventId: e.id }}
          className="block rounded-xl border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden"
        >
          <div className="flex gap-4 p-4">
            <div className="flex-1 min-w-0">
              {time12 && (
                <div className="text-[11px] text-muted-foreground">{time12}</div>
              )}
              <div className="text-[16px] font-semibold leading-snug mt-0.5">{e.name}</div>

              <div className="mt-2 space-y-1.5">
                {locationLabel && (
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <LocationIcon className="size-3.5" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>{linked.length} guests</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex items-center h-7 px-3 rounded-md border border-border bg-background text-[11px] font-medium hover:bg-accent transition-colors">
                  Manage Event →
                </span>
                {shown.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {shown.map(c => (
                      <span
                        key={c.id}
                        title={c.name}
                        className="size-6 rounded-full border border-card bg-muted grid place-items-center text-[9px] font-semibold text-foreground/80"
                      >
                        {initials(c.name)}
                      </span>
                    ))}
                    {remaining > 0 && (
                      <span className="size-6 rounded-full border border-card bg-muted grid place-items-center text-[9px] font-semibold text-muted-foreground">
                        +{remaining}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="size-24 shrink-0 rounded-lg"
              style={{ background: e.cover }}
              aria-hidden
            />
          </div>
        </Link>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}
                className="size-7 grid place-items-center rounded-md bg-background/80 backdrop-blur border border-border hover:bg-background"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(ev) => ev.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(e)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(e.id)} className="text-destructive focus:text-destructive">Borrar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}
