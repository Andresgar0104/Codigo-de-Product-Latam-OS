import { useMemo, useRef, useState, useEffect } from "react";
import type { Company } from "@/lib/mock-data";
import { ChevronDown, X } from "lucide-react";

export function CompanyCombobox({
  value,
  companies,
  onChange,
  onCreate,
  placeholder = "Buscar empresa…",
  allowClear = true,
}: {
  value: string;
  companies: Company[];
  onChange: (companyId: string) => void;
  onCreate: (name: string) => Company;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const current = companies.find(c => c.id === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return companies.slice(0, 20);
    return companies.filter(c => c.name.toLowerCase().includes(s)).slice(0, 20);
  }, [companies, query]);

  const exact = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return null;
    return companies.find(c => c.name.toLowerCase() === s) ?? null;
  }, [companies, query]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function create() {
    const name = query.trim();
    if (!name) return;
    const co = onCreate(name);
    pick(co.id);
  }

  return (
    <div ref={wrapRef} className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setQuery(""); }}
          className="w-full h-9 px-3 text-left text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring flex items-center justify-between"
        >
          <span className={current ? "" : "text-muted-foreground"}>
            {current ? current.name : "— Sin empresa —"}
          </span>
          <div className="flex items-center gap-1">
            {allowClear && current && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </div>
        </button>
      ) : (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); }
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) pick(filtered[0].id);
              else if (query.trim()) create();
            }
          }}
        />
      )}

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {filtered.map(c => (
            <button
              type="button"
              key={c.id}
              onClick={() => pick(c.id)}
              className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted"
            >
              {c.name}
              {c.domain && <span className="text-muted-foreground"> · {c.domain}</span>}
            </button>
          ))}
          {filtered.length === 0 && !query.trim() && (
            <div className="px-3 py-2 text-[12px] text-muted-foreground italic">Sin empresas.</div>
          )}
          {query.trim() && !exact && (
            <button
              type="button"
              onClick={create}
              className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted border-t border-border text-primary"
            >
              + Crear empresa "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
