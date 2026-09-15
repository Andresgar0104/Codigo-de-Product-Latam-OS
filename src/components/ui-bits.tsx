import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/mock-data";

const tagPalette = [
  "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "bg-pink-500/15 text-pink-300 border-pink-500/30",
  "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "bg-orange-500/15 text-orange-300 border-orange-500/30",
];

function hashIdx(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % tagPalette.length;
}

export function TagChip({
  label, onRemove, className,
}: { label: string; onRemove?: () => void; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border", tagPalette[hashIdx(label)], className)}>
      {label}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="opacity-60 hover:opacity-100 leading-none">×</button>
      )}
    </span>
  );
}

export function TagList({ tags, max = 2 }: { tags: string[]; max?: number }) {
  const shown = tags.slice(0, max);
  const overflow = tags.length - shown.length;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map(t => <TagChip key={t} label={t} />)}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground">+{overflow}</span>
      )}
    </div>
  );
}

export function StageChip({ stage }: { stage: Stage }) {
  const map: Record<Stage, string> = {
    contacted: "bg-blue-500/15 text-blue-300",
    engaged: "bg-violet-500/15 text-violet-300",
    meeting: "bg-amber-500/15 text-amber-300",
    proposal: "bg-orange-500/15 text-orange-300",
    won: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    lost: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize", map[stage])}>
      {stage}
    </span>
  );
}

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-border flex items-end justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label, value, delta, unit,
}: { label: string; value: string | number; delta?: number; unit?: string }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tabular-nums">{value}{unit}</div>
        {delta !== undefined && (
          <span className={cn("text-[11px] font-medium tabular-nums", positive ? "text-[color:var(--success)]" : "text-destructive")}>
            {positive ? "+" : ""}{Math.round(delta * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("h-1.5 rounded-full bg-muted overflow-hidden", className)}>
      <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function formatShortDate(iso: string) {
  // Parse ISO string directly (YYYY-MM-DD) — no Date object, no timezone drift.
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${months[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}`;
}
