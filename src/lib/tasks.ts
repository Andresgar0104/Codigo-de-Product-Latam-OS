import type { Task, TaskPriority } from "@/lib/mock-data";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgente: 0,
  importante: 1,
  keep_in_mind: 2,
};

function priorityRank(p?: TaskPriority): number {
  return p ? PRIORITY_RANK[p] : 3;
}

/** Today at 00:00 local time, as a millisecond timestamp. */
function todayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Parse ISO yyyy-mm-dd as local midnight. Returns null if invalid. */
export function parseDueDate(iso?: string): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type DueTone = "overdue" | "soon" | "muted";

export function dueTone(iso?: string, status?: string): DueTone {
  if (!iso || status === "done") return "muted";
  const t = parseDueDate(iso);
  if (t == null) return "muted";
  const today = todayMs();
  if (t < today) return "overdue";
  const diffDays = Math.round((t - today) / (24 * 60 * 60 * 1000));
  if (diffDays <= 7) return "soon";
  return "muted";
}

export const dueToneClass: Record<DueTone, string> = {
  overdue: "text-red-400 border-red-500/40 bg-red-500/10",
  soon: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  muted: "text-muted-foreground border-dashed border-border",
};

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatDueShort(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS_ES[parseInt(m[2], 10) - 1]}`;
}

/**
 * Sort pending tasks (status !== "done"):
 *  1. Overdue first (dueDate in past)
 *  2. Then by soonest dueDate (no date = last within its group)
 *  3. Then by priority urgente > importante > keep_in_mind > none
 */
export function sortPendingTasks(tasks: Task[]): Task[] {
  const today = todayMs();
  return [...tasks].sort((a, b) => {
    const aT = parseDueDate(a.dueDate);
    const bT = parseDueDate(b.dueDate);
    const aOverdue = aT != null && aT < today ? 1 : 0;
    const bOverdue = bT != null && bT < today ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;
    // Both overdue or both not-overdue: earlier date first, undefined last
    if (aT != null && bT != null && aT !== bT) return aT - bT;
    if (aT != null && bT == null) return -1;
    if (aT == null && bT != null) return 1;
    return priorityRank(a.priority) - priorityRank(b.priority);
  });
}
