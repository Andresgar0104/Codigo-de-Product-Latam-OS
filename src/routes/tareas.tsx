import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { type Task, type TaskStatus, type TaskPriority } from "@/lib/mock-data";
import { useChecklist, useStore } from "@/components/deals-context";
import { useWorkspace } from "@/components/workspace-context";
import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDueDate } from "@/components/task-due-date";

import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

export const Route = createFileRoute("/tareas")({
  head: () => ({ meta: [{ title: "Tareas · Latam Leap" }] }),
  component: TareasPage,
});

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

const PRIORITY_META: Record<TaskPriority, { label: string; cls: string }> = {
  keep_in_mind: { label: "To keep in mind", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  importante: { label: "importante", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  urgente: { label: "urgente", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

const ORDER: TaskStatus[] = ["todo", "doing", "done"];
function prevStatus(s: TaskStatus): TaskStatus | null { const i = ORDER.indexOf(s); return i > 0 ? ORDER[i - 1] : null; }
function nextStatus(s: TaskStatus): TaskStatus | null { const i = ORDER.indexOf(s); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; }

function TareasPage() {
  const { workspace } = useWorkspace();
  const { events } = useStore();
  const { tasks, addTask, updateTask, deleteTask } = useChecklist();

  const wsEvents = useMemo(() => events.filter(e => e.workspaceId === workspace.id), [events, workspace.id]);
  const [eventId, setEventId] = useState<string>(wsEvents[0]?.id ?? "");
  const event = wsEvents.find(e => e.id === eventId) ?? wsEvents[0];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!event) {
    return (
      <AppShell>
        <PageHeader title="Tareas" />
        <div className="p-6 text-[13px] text-muted-foreground">Sin eventos en esta cuenta.</div>
      </AppShell>
    );
  }

  const evTasks = tasks.filter(t => t.eventId === event.id);
  const checklistDone = evTasks.filter(t => t.status === "done").length;
  const checklistTotal = evTasks.length;

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const over = e.over?.id;
    if (!over) return;
    const newStatus = String(over) as TaskStatus;
    if (!COLUMNS.some(c => c.id === newStatus)) return;
    const t = tasks.find(x => x.id === id);
    if (!t || t.status === newStatus) return;
    updateTask(id, { status: newStatus });
  }

  return (
    <AppShell>
      <PageHeader
        title="Tareas"
        actions={
          <>
            <select
              value={event.id}
              onChange={(e) => setEventId(e.target.value)}
              className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            >
              {wsEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {checklistDone}/{checklistTotal} tareas
            </span>
          </>
        }
      />

      <div className="p-6">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colTasks = evTasks.filter(t => t.status === col.id);
              return (
                <Column
                  key={col.id}
                  status={col.id}
                  label={col.label}
                  tasks={colTasks}
                  onAdd={() => addTask(event.id, col.id, "")}
                  onPatch={updateTask}
                  onDelete={deleteTask}
                />
              );
            })}
          </div>
        </DndContext>
      </div>
    </AppShell>
  );
}

function Column({
  status, label, tasks, onAdd, onPatch, onDelete,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-border bg-card flex flex-col min-h-[200px] transition-colors",
        isOver && "border-primary/50 bg-muted/40"
      )}
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums px-1.5 py-0.5 rounded bg-muted">
          {tasks.length}
        </span>
      </div>
      <div className="p-2 flex-1 space-y-2">
        {tasks.map(t => (
          <TaskCard key={t.id} t={t} onPatch={onPatch} onDelete={onDelete} />
        ))}
      </div>
      <button
        onClick={onAdd}
        className="w-full px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-muted/30 inline-flex items-center gap-1.5 border-t border-border"
      >
        <Plus className="size-3.5" /> Add card
      </button>
    </div>
  );
}

function TaskCard({
  t, onPatch, onDelete,
}: { t: Task; onPatch: (id: string, patch: Partial<Task>) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id });
  const [editing, setEditing] = useState(t.title === "");
  const [showPriority, setShowPriority] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!showPriority) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowPriority(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showPriority]);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  const pMeta = t.priority ? PRIORITY_META[t.priority] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-md border border-border bg-background p-2.5 shadow-sm hover:border-primary/40 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
        >
          {editing ? (
            <input
              ref={inputRef}
              value={t.title}
              onChange={(e) => onPatch(t.id, { title: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
              placeholder="Nueva tarea…"
              className="w-full bg-transparent text-[13px] focus:outline-none"
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="text-[13px] leading-snug cursor-text"
            >
              {t.title || <span className="italic text-muted-foreground">sin título</span>}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(t.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Eliminar"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5 relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowPriority(s => !s); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border",
            pMeta ? pMeta.cls : "text-muted-foreground border-dashed border-border hover:text-foreground"
          )}
        >
          {pMeta ? pMeta.label : "+ prioridad"}
        </button>
        {showPriority && (
          <div
            ref={menuRef}
            className="absolute z-30 top-full mt-1 left-0 w-44 rounded-md border border-border bg-popover shadow-lg p-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {(Object.keys(PRIORITY_META) as TaskPriority[]).map(p => (
              <button
                key={p}
                onClick={() => { onPatch(t.id, { priority: p }); setShowPriority(false); }}
                className="w-full text-left px-2 py-1.5 text-[12px] rounded hover:bg-muted flex items-center gap-2"
              >
                <span className={cn("size-2 rounded-full", PRIORITY_META[p].cls)} />
                {PRIORITY_META[p].label}
              </button>
            ))}
            {t.priority && (
              <button
                onClick={() => { onPatch(t.id, { priority: undefined }); setShowPriority(false); }}
                className="w-full text-left px-2 py-1.5 text-[12px] rounded hover:bg-muted text-muted-foreground border-t border-border mt-1"
              >
                Quitar prioridad
              </button>
            )}
          </div>
        )}
        <TaskDueDate
          dueDate={t.dueDate}
          status={t.status}
          onChange={(dueDate) => onPatch(t.id, { dueDate })}
        />


        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {prevStatus(t.status) && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onPatch(t.id, { status: prevStatus(t.status)! }); }}
              className="size-5 grid place-items-center rounded hover:bg-muted text-muted-foreground"
              aria-label="Mover atrás"
            >
              <ChevronLeft className="size-3" />
            </button>
          )}
          {nextStatus(t.status) && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onPatch(t.id, { status: nextStatus(t.status)! }); }}
              className="size-5 grid place-items-center rounded hover:bg-muted text-muted-foreground"
              aria-label="Mover adelante"
            >
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
