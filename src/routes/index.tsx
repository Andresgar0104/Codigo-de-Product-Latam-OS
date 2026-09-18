import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Stat, ProgressBar, formatShortDate } from "@/components/ui-bits";
import { useStore } from "@/components/deals-context";
import { useWorkspace } from "@/components/workspace-context";
import { ArrowUpRight, Check } from "lucide-react";
import { useMemo } from "react";
import { parseDueDate } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · Latam Leap" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { workspace } = useWorkspace();
  const { contacts, deals, events, tasks } = useStore();

  const wsContacts = contacts.filter(c => c.workspaceId === workspace.id);
  const wsDeals = deals.filter(d => d.workspaceId === workspace.id);
  const wsEvents = events.filter(e => e.workspaceId === workspace.id);

  const activeContacts = wsContacts.length;
  const upcoming = wsEvents.filter(e => e.status === "upcoming");
  const pipelineCount = wsDeals.filter(d => d.stage !== "lost").length;

  const todayMs = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }, []);
  const in7Ms = todayMs + 7 * 24 * 60 * 60 * 1000;

  const eventProgress = useMemo(() => {
    const rows = upcoming.map(e => {
      const evTasks = tasks.filter(t => t.eventId === e.id);
      const total = evTasks.length;
      const done = evTasks.filter(t => t.status === "done").length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      let overdue = false;
      let soon = false;
      for (const t of evTasks) {
        if (t.status === "done") continue;
        const t0 = parseDueDate(t.dueDate);
        if (t0 == null) continue;
        if (t0 < todayMs) overdue = true;
        else if (t0 <= in7Ms) soon = true;
      }
      const tone: "overdue" | "soon" | "done" | "normal" =
        total === 0 ? "normal"
        : pct === 100 ? "done"
        : overdue ? "overdue"
        : soon ? "soon"
        : "normal";
      return { event: e, total, done, pct, tone };
    }).filter(r => r.total > 0);

    const rank: Record<typeof rows[number]["tone"], number> = { overdue: 0, soon: 1, normal: 2, done: 3 };
    rows.sort((a, b) => {
      const r = rank[a.tone] - rank[b.tone];
      if (r !== 0) return r;
      return a.pct - b.pct;
    });
    return rows;
  }, [upcoming, tasks, todayMs, in7Ms]);

  const visibleProgress = eventProgress.slice(0, 6);
  const hasMore = eventProgress.length > 6;

  return (
    <AppShell>
      <PageHeader title="Dashboard" subtitle="Resumen de la cuenta" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Stat label="Pipeline" value={pipelineCount} />
          <Stat label="Contactos activos" value={activeContacts} />
          <Stat label="Eventos activos" value={upcoming.length} />
        </div>

        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Eventos activos</h2>
            <Link to="/events" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcoming.map(e => {
              const evTasks = tasks.filter(t => t.eventId === e.id);
              const done = evTasks.filter(t => t.status === "done").length;
              return (
                <Link
                  key={e.id}
                  to="/events/$eventId"
                  params={{ eventId: e.id }}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-md" style={{ background: e.cover }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{e.city} · {formatShortDate(e.date)}</div>
                  </div>
                  <div className="w-44">
                    <div className="text-[11px] text-muted-foreground mb-1 tabular-nums text-right">
                      {done}/{evTasks.length} tareas
                    </div>
                    <ProgressBar value={done} max={evTasks.length} />
                  </div>
                </Link>
              );
            })}
            {upcoming.length === 0 && (
              <div className="px-4 py-6 text-[12px] text-muted-foreground italic text-center">Sin eventos próximos.</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Pendientes</h2>
            {hasMore && (
              <Link to="/events" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                Ver todos los eventos <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>
          {visibleProgress.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-muted-foreground italic text-center">Sin pendientes por ahora 🎉</div>
          ) : (
            <ul className="divide-y divide-border">
              {visibleProgress.map(({ event, total, done, pct, tone }) => {
                const isDone = tone === "done";
                return (
                  <li key={event.id} className={cn("px-4 py-3", isDone && "opacity-60")}>
                    <div className="flex items-center gap-2">
                      {tone === "overdue" && <span className="size-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />}
                      {tone === "soon" && <span className="size-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />}
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: event.id }}
                        className="text-[13px] font-semibold truncate hover:underline flex-1 min-w-0"
                      >
                        {event.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {done}/{total} tareas · {pct}%
                      </div>
                    </div>
                    <div className="mt-2">
                      {isDone ? (
                        <div className="flex items-center gap-1 text-[11px] text-[color:var(--success)]">
                          <Check className="size-3" /> Completado
                        </div>
                      ) : (
                        <ProgressBar value={done} max={total} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
