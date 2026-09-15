import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { dueTone, dueToneClass, formatDueShort } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/mock-data";
import { X } from "lucide-react";

interface Props {
  dueDate?: string;
  status?: TaskStatus;
  onChange: (dueDate: string | undefined) => void;
  size?: "sm" | "md";
  className?: string;
}

export function TaskDueDate({ dueDate, status, onChange, size = "sm", className }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      // slight delay so click doesn't immediately close
      const id = window.setTimeout(() => inputRef.current?.showPicker?.() ?? inputRef.current?.focus(), 10);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const tone = dueTone(dueDate, status);
  const cls = dueToneClass[tone];
  const label = dueDate ? formatDueShort(dueDate) : "+ fecha";

  const sizeCls = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 gap-1"
    : "text-[11px] px-2 py-1 gap-1.5";

  return (
    <div ref={wrapRef} className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center rounded border font-medium",
          dueDate ? cls : "text-muted-foreground border-dashed border-border hover:text-foreground",
          sizeCls,
        )}
      >
        <span>{label}</span>
        {dueDate && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Quitar fecha"
            onClick={(e) => { e.stopPropagation(); onChange(undefined); setOpen(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-60 hover:opacity-100"
          >
            <X className="size-2.5" />
          </span>
        )}
      </button>
      {open && (
        <input
          ref={inputRef}
          type="date"
          value={dueDate ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v || undefined);
          }}
          onBlur={() => setOpen(false)}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute z-40 top-full mt-1 left-0 h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
        />
      )}
    </div>
  );
}
