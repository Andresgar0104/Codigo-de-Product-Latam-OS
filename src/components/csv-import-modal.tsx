import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/components/deals-context";
import type {
  Company, Contact, Event as EventT, EventContact, EventContactStatus,
} from "@/lib/mock-data";
import { EVENT_CONTACT_STATUS_LABEL } from "@/lib/mock-data";

type ExpectedKey = "name" | "lastName" | "email" | "title" | "company" | "linkedin" | "event" | "status";

const TARGET_LABEL: Record<ExpectedKey, string> = {
  name: "Nombre",
  lastName: "Apellido",
  email: "Email",
  title: "Puesto",
  company: "Empresa",
  linkedin: "LinkedIn",
  event: "Evento",
  status: "Estatus",
};

const AUTO_GUESS: Record<ExpectedKey, string[]> = {
  name: ["first_name", "firstname", "first name", "nombre", "name"],
  lastName: ["last_name", "lastname", "last name", "apellido", "surname"],
  email: ["email", "e-mail", "correo", "mail"],
  title: ["puesto", "posicion", "position", "title", "cargo", "role"],
  company: ["empresa", "company", "compania", "organizacion", "account"],
  linkedin: ["linkedin", "linked in", "perfil"],
  event: ["evento", "event"],
  status: ["estatus", "status", "asistencia", "attendance"],
};

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function guessColumn(key: ExpectedKey, headers: string[]): string {
  const tokens = AUTO_GUESS[key];
  for (const h of headers) {
    const n = norm(h);
    if (key === "name" && n.includes("last")) continue;
    for (const t of tokens) {
      if (n.includes(norm(t))) return h;
    }
  }
  return "";
}

function autoMapStatus(raw: string): EventContactStatus {
  const s = norm(raw);
  if (["asistio", "attended", "asistencia"].includes(s)) return "asistio";
  if (["no-show", "noshow", "no show", "no_show", "ausente"].includes(s)) return "no_show";
  if (["registrado", "registered", "registro"].includes(s)) return "registrado";
  return "registrado";
}

type ParsedRow = Record<string, string>;
type ColMap = Partial<Record<ExpectedKey, string>>;
type EventMode = "single" | "per_row" | "none";

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

interface Summary {
  newContacts: number;
  updatedContacts: number;
  newCompanies: number;
  eventLinks: number;
  skipped: number;
  skipReasons: string[];
  errors: string[];
}

export function CsvImportModal({ open, onClose, workspaceId }: Props) {
  const { companies, contacts, events, eventContacts, addEvent, refreshData } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [colMap, setColMap] = useState<ColMap>({});

  const [eventMode, setEventMode] = useState<EventMode>("single");
  const [singleEventId, setSingleEventId] = useState<string>("");
  const [singleStatus, setSingleStatus] = useState<EventContactStatus>("asistio");

  const [eventMap, setEventMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, EventContactStatus>>({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [importing, setImporting] = useState(false);

  function reset() {
    setStep(1); setRows([]); setHeaders([]); setColMap({});
    setEventMode("single"); setSingleEventId(""); setSingleStatus("asistio");
    setEventMap({}); setStatusMap({}); setProgress({ done: 0, total: 0 });
    setSummary(null); setImporting(false);
  }

  function handleClose() { reset(); onClose(); }

  function handleFile(file: File) {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hs = res.meta.fields ?? [];
        setHeaders(hs);
        setRows(res.data as ParsedRow[]);
        const cm: ColMap = {};
        for (const key of Object.keys(AUTO_GUESS) as ExpectedKey[]) {
          const g = guessColumn(key, hs);
          if (g) cm[key] = g;
        }
        setColMap(cm);
      },
    });
  }

  const wsCompanies = useMemo(() => companies.filter(c => c.workspaceId === workspaceId), [companies, workspaceId]);
  const wsContacts = useMemo(() => contacts.filter(c => c.workspaceId === workspaceId), [contacts, workspaceId]);
  const wsEvents = useMemo(() => events.filter(e => e.workspaceId === workspaceId), [events, workspaceId]);

  useEffect(() => {
    if (!singleEventId && wsEvents.length > 0) setSingleEventId(wsEvents[0].id);
  }, [wsEvents, singleEventId]);

  const getCell = (r: ParsedRow, k: ExpectedKey) => {
    const col = colMap[k];
    if (!col) return "";
    return (r[col] ?? "").toString().trim();
  };

  const distinctEvents = useMemo(() => {
    if (!colMap.event) return [];
    const set = new Set<string>();
    for (const r of rows) {
      const v = getCell(r, "event");
      if (v) set.add(v);
    }
    return [...set];
  }, [rows, colMap.event]);

  const distinctStatuses = useMemo(() => {
    if (!colMap.status) return [];
    const set = new Set<string>();
    for (const r of rows) {
      const v = getCell(r, "status");
      if (v) set.add(v);
    }
    return [...set];
  }, [rows, colMap.status]);

  function goStep2() {
    const em: Record<string, string> = { ...eventMap };
    for (const e of distinctEvents) {
      if (em[e] !== undefined) continue;
      const match = wsEvents.find(x => norm(x.name) === norm(e));
      em[e] = match ? match.id : "__new__";
    }
    setEventMap(em);

    const sm: Record<string, EventContactStatus> = { ...statusMap };
    for (const s of distinctStatuses) {
      if (sm[s] !== undefined) continue;
      sm[s] = autoMapStatus(s);
    }
    setStatusMap(sm);

    if (eventMode === "per_row" && !colMap.event) setEventMode("single");
    setStep(2);
  }

  const preImportStats = useMemo(() => {
    const existingCompanyNames = new Set(wsCompanies.map(c => norm(c.name)));
    const seenCompanies = new Set<string>();
    let newCompaniesCount = 0;
    let eventLinkRows = 0;
    let contactRowCount = 0;
    for (const r of rows) {
      const nm = `${getCell(r, "name")} ${getCell(r, "lastName")}`.trim();
      const email = getCell(r, "email");
      if (!nm && !email) continue;
      contactRowCount++;
      const co = getCell(r, "company");
      if (co) {
        const n = norm(co);
        if (!existingCompanyNames.has(n) && !seenCompanies.has(n)) {
          seenCompanies.add(n);
          newCompaniesCount++;
        }
      }
      if (eventMode === "single" && singleEventId) {
        eventLinkRows++;
      } else if (eventMode === "per_row") {
        const evName = getCell(r, "event");
        if (evName) {
          const target = eventMap[evName];
          if (target && target !== "__none__") eventLinkRows++;
        }
      }
    }
    const distinctCompaniesInFile = new Set<string>();
    for (const r of rows) {
      const co = getCell(r, "company");
      if (co) distinctCompaniesInFile.add(norm(co));
    }
    return {
      contactRowCount,
      companiesCount: distinctCompaniesInFile.size,
      newCompaniesCount,
      eventLinkRows,
    };
  }, [rows, colMap, wsCompanies, eventMap, eventMode, singleEventId]);

  async function runImport() {
    setImporting(true);
    setStep(3);
    const errors: string[] = [];
    const skipReasons: string[] = [];
    let skipped = 0;

    const companyByName = new Map<string, string>();
    for (const c of wsCompanies) companyByName.set(norm(c.name), c.id);
    const contactByEmail = new Map<string, string>();
    for (const c of wsContacts) {
      if (c.email) contactByEmail.set(norm(c.email), c.id);
    }
    const existingLinks = new Set<string>();
    for (const ec of eventContacts) existingLinks.add(`${ec.eventId}:${ec.contactId}`);

    const usable: ParsedRow[] = [];
    for (const r of rows) {
      const nm = `${getCell(r, "name")} ${getCell(r, "lastName")}`.trim();
      const email = getCell(r, "email");
      if (!nm && !email) { skipped++; continue; }
      usable.push(r);
    }
    if (skipped > 0) skipReasons.push(`${skipped} sin nombre y sin correo`);

    setProgress({ done: 0, total: usable.length });

    // PHASE 0 — events (per-row mode only)
    const eventIdByCsvName = new Map<string, string>();
    if (eventMode === "per_row") {
      for (const [csvName, target] of Object.entries(eventMap)) {
        if (target === "__new__") {
          const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const newEv: EventT = {
            id, name: csvName, date: "", city: "", registrations: 0, target: 0,
            status: "past", cover: "", workspaceId,
          };
          const { error } = await supabase.from("events").insert(newEv as any);
          if (error) errors.push(`Evento "${csvName}": ${error.message}`);
          else { eventIdByCsvName.set(csvName, id); addEvent(newEv); }
        } else if (target && target !== "__none__") {
          eventIdByCsvName.set(csvName, target);
        }
      }
    }

    // PHASE A — Companies
    const companiesToCreate: Company[] = [];
    const seen = new Set<string>();
    for (const r of usable) {
      const co = getCell(r, "company");
      if (!co) continue;
      const key = norm(co);
      if (companyByName.has(key) || seen.has(key)) continue;
      seen.add(key);
      const id = `co_${Date.now()}_${companiesToCreate.length}`;
      companiesToCreate.push({ id, name: co, domain: "", industry: "", size: "", country: "", workspaceId });
      companyByName.set(key, id);
    }
    let newCompanies = 0;
    if (companiesToCreate.length) {
      const { error } = await supabase.from("companies").insert(companiesToCreate as any);
      if (error) {
        errors.push(`Empresas: ${error.message}`);
        setProgress({ done: usable.length, total: usable.length });
        await refreshData();
        setSummary({ newContacts: 0, updatedContacts: 0, newCompanies: 0, eventLinks: 0, skipped, skipReasons, errors });
        setImporting(false);
        return;
      }
      newCompanies = companiesToCreate.length;
    }

    // Ground truth: re-read companies straight from the DB so no contact can
    // reference an id that isn't actually persisted (stale state, silent drops).
    {
      const { data: dbCompanies, error: coErr } = await supabase
        .from("companies").select("id,name").eq("workspaceId", workspaceId);
      if (coErr) {
        errors.push(`Leer empresas: ${coErr.message}`);
      } else if (dbCompanies) {
        companyByName.clear();
        for (const c of dbCompanies as { id: string; name: string }[]) {
          companyByName.set(norm(c.name), c.id);
        }
      }
    }
    const validCompanyIds = new Set(companyByName.values());

    // PHASE B — Contacts
    const contactsToInsert: Contact[] = [];
    const contactUpdates: { id: string; patch: Partial<Contact> }[] = [];
    const rowContactId: (string | null)[] = new Array(usable.length).fill(null);

    for (let i = 0; i < usable.length; i++) {
      const r = usable[i];
      const first = getCell(r, "name");
      const last = getCell(r, "lastName");
      const nm = `${first} ${last}`.trim();
      const email = getCell(r, "email");
      const title = getCell(r, "title");
      const linkedin = getCell(r, "linkedin");
      const coName = getCell(r, "company");
      const resolved = coName ? companyByName.get(norm(coName)) : undefined;
      const companyId = resolved && validCompanyIds.has(resolved) ? resolved : null;


      if (email) {
        const existingId = contactByEmail.get(norm(email));
        if (existingId) {
          const cur = wsContacts.find(c => c.id === existingId);
          const patch: Partial<Contact> = {};
          if (cur) {
            if (!cur.title && title) patch.title = title;
            if (!cur.linkedin && linkedin) patch.linkedin = linkedin;
            if (!cur.companyId && companyId) patch.companyId = companyId;
            if (!cur.name && nm) patch.name = nm;
            if (!cur.firstName && first) patch.firstName = first;
            if (!cur.lastName && last) patch.lastName = last;
          }
          if (Object.keys(patch).length) contactUpdates.push({ id: existingId, patch });
          rowContactId[i] = existingId;
          continue;
        }
      }

      const id = `ct_${Date.now()}_${i}`;
      const c: Contact = {
        id, name: nm, firstName: first, lastName: last,
        title, email, linkedin, companyId: companyId ?? "", workspaceId, tags: [], lastTouch: "",
      };
      // Send null (not "") for missing FK to avoid contacts_company_fk violation
      contactsToInsert.push({ ...c, companyId: companyId as any });
      if (email) contactByEmail.set(norm(email), id);
      rowContactId[i] = id;

    }

    let newContacts = 0;
    const insertedContactIds = new Set<string>();
    for (const c of wsContacts) insertedContactIds.add(c.id);
    if (contactsToInsert.length) {
      const CHUNK = 100;
      for (let s = 0; s < contactsToInsert.length; s += CHUNK) {
        const chunk = contactsToInsert.slice(s, s + CHUNK);
        const { error } = await supabase.from("contacts").insert(chunk as any);
        if (error) {
          errors.push(`Contactos (filas ${s + 1}-${s + chunk.length}): ${error.message}`);
        } else {
          newContacts += chunk.length;
          for (const c of chunk) insertedContactIds.add(c.id);
        }
      }
    }


    let updatedContacts = 0;
    for (const u of contactUpdates) {
      const { error } = await supabase.from("contacts").update(u.patch as any).eq("id", u.id);
      if (error) errors.push(`Actualizar contacto ${u.id}: ${error.message}`);
      else updatedContacts++;
      setProgress(p => ({ ...p, done: Math.min(p.total, p.done + 1) }));
    }

    // PHASE C — Event links
    const linksToInsert: EventContact[] = [];
    for (let i = 0; i < usable.length; i++) {
      const contactId = rowContactId[i];
      if (!contactId) continue;
      // Skip rows whose contact never actually landed in the DB
      if (!insertedContactIds.has(contactId)) continue;


      let eventId = "";
      let status: EventContactStatus = "asistio";

      if (eventMode === "single") {
        if (!singleEventId) continue;
        eventId = singleEventId;
        status = singleStatus;
      } else if (eventMode === "per_row") {
        const r = usable[i];
        const evName = getCell(r, "event");
        if (!evName) continue;
        const eid = eventIdByCsvName.get(evName);
        if (!eid) continue;
        eventId = eid;
        const rawStatus = getCell(r, "status");
        status = rawStatus ? (statusMap[rawStatus] ?? autoMapStatus(rawStatus)) : "asistio";
      } else {
        continue;
      }

      const linkKey = `${eventId}:${contactId}`;
      if (existingLinks.has(linkKey)) continue;
      existingLinks.add(linkKey);

      linksToInsert.push({
        id: `ec_${Date.now()}_${i}`,
        eventId, contactId, status, role: "asistente",
        createdAt: new Date().toISOString(),
      });
    }

    let eventLinks = 0;
    if (linksToInsert.length) {
      const CHUNK = 100;
      for (let s = 0; s < linksToInsert.length; s += CHUNK) {
        const chunk = linksToInsert.slice(s, s + CHUNK);
        const { error } = await supabase.from("event_contacts").insert(chunk as any);
        if (error) errors.push(`Vínculos a eventos (${s + 1}-${s + chunk.length}): ${error.message}`);
        else eventLinks += chunk.length;
      }
    }


    setProgress({ done: usable.length, total: usable.length });
    await refreshData();

    setSummary({ newContacts, updatedContacts, newCompanies, eventLinks, skipped, skipReasons, errors });
    setImporting(false);
  }

  const targetKeys: ExpectedKey[] = ["name", "lastName", "email", "title", "company", "linkedin", "event", "status"];
  const importableCount = useMemo(() => {
    let n = 0;
    for (const r of rows) {
      const nm = `${getCell(r, "name")} ${getCell(r, "lastName")}`.trim();
      const email = getCell(r, "email");
      if (nm || email) n++;
    }
    return n;
  }, [rows, colMap]);

  const canGoStep2 = importableCount > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar contactos desde CSV</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="block w-full text-[12px] file:h-8 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer file:mr-3"
            />
            {rows.length > 0 && (
              <>
                <div className="text-[12px] text-muted-foreground">
                  {rows.length} filas detectadas · {importableCount} importables
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Mapeo de columnas</div>
                  <div className="grid grid-cols-2 gap-2">
                    {targetKeys.map(k => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-[12px] w-20 shrink-0">{TARGET_LABEL[k]}</span>
                        <select
                          value={colMap[k] ?? ""}
                          onChange={(e) => setColMap(m => ({ ...m, [k]: e.target.value || undefined }))}
                          className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring flex-1 min-w-0"
                        >
                          <option value="">— ninguna —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Vista previa (primeras 5 filas)</div>
                  <div className="rounded-md border border-border overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-muted/40">
                        <tr>
                          {targetKeys.filter(k => colMap[k]).map(k => (
                            <th key={k} className="text-left px-2 py-1.5 font-medium">{TARGET_LABEL[k]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            {targetKeys.filter(k => colMap[k]).map(k => (
                              <td key={k} className="px-2 py-1 truncate max-w-[140px]">{getCell(r, k)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Vinculación a eventos</div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-[12px]">
                  <input type="radio" checked={eventMode === "single"} onChange={() => setEventMode("single")} className="mt-0.5" />
                  <div className="flex-1">
                    <div>Todo el archivo es de un evento</div>
                    {eventMode === "single" && (
                      <div className="flex gap-2 mt-2">
                        <select
                          value={singleEventId}
                          onChange={(e) => setSingleEventId(e.target.value)}
                          className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring flex-1"
                        >
                          {wsEvents.length === 0 && <option value="">Sin eventos</option>}
                          {wsEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                        <select
                          value={singleStatus}
                          onChange={(e) => setSingleStatus(e.target.value as EventContactStatus)}
                          className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring min-w-[140px]"
                        >
                          {(Object.keys(EVENT_CONTACT_STATUS_LABEL) as EventContactStatus[]).map(k => (
                            <option key={k} value={k}>{EVENT_CONTACT_STATUS_LABEL[k]}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-2 text-[12px] ${!colMap.event ? "opacity-50" : ""}`}>
                  <input
                    type="radio"
                    checked={eventMode === "per_row"}
                    disabled={!colMap.event}
                    onChange={() => setEventMode("per_row")}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div>Cada fila trae su propio evento {!colMap.event && <span className="text-muted-foreground">(mapea la columna "Evento" en el paso 1)</span>}</div>
                    {eventMode === "per_row" && (
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1.5">
                          {distinctEvents.map(evName => (
                            <div key={evName} className="flex items-center gap-2">
                              <span className="text-[12px] flex-1 truncate">{evName}</span>
                              <select
                                value={eventMap[evName] ?? "__new__"}
                                onChange={(e) => setEventMap(m => ({ ...m, [evName]: e.target.value }))}
                                className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring min-w-[220px]"
                              >
                                <option value="__new__">Crear evento nuevo</option>
                                <option value="__none__">No vincular</option>
                                {wsEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        {distinctStatuses.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border">
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Estatus</div>
                            {distinctStatuses.map(s => (
                              <div key={s} className="flex items-center gap-2">
                                <span className="text-[12px] flex-1 truncate">{s}</span>
                                <select
                                  value={statusMap[s] ?? "registrado"}
                                  onChange={(e) => setStatusMap(m => ({ ...m, [s]: e.target.value as EventContactStatus }))}
                                  className="h-8 px-2 text-[12px] bg-background border border-border rounded-md focus:outline-none focus:border-ring min-w-[140px]"
                                >
                                  {(Object.keys(EVENT_CONTACT_STATUS_LABEL) as EventContactStatus[]).map(k => (
                                    <option key={k} value={k}>{EVENT_CONTACT_STATUS_LABEL[k]}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-2 text-[12px]">
                  <input type="radio" checked={eventMode === "none"} onChange={() => setEventMode("none")} className="mt-0.5" />
                  <div className="flex-1">No vincular a ningún evento</div>
                </label>
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 text-[12px] p-2.5">
              {preImportStats.contactRowCount} contactos, {preImportStats.companiesCount} empresas ({preImportStats.newCompaniesCount} nuevas se crearán), {preImportStats.eventLinkRows} se vincularán a eventos
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {importing || !summary ? (
              <div className="text-[13px]">Importando… {progress.done}/{progress.total}</div>
            ) : (
              <>
                <div className="text-[13px]">
                  {summary.newContacts} contactos nuevos · {summary.updatedContacts} actualizados · {summary.newCompanies} empresas creadas · {summary.eventLinks} vínculos a eventos · {summary.skipped} filas omitidas
                </div>
                {summary.skipReasons.length > 0 && (
                  <div className="text-[12px] text-muted-foreground">
                    Omitidas: {summary.skipReasons.join("; ")}
                  </div>
                )}
                {summary.errors.length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 text-[12px] p-2.5 space-y-1">
                    <div className="font-medium">Errores:</div>
                    {summary.errors.map((e, i) => <div key={i}>{e}</div>)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <button onClick={handleClose} className="h-9 px-3 text-[12px] text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                onClick={goStep2}
                disabled={!canGoStep2}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-50"
              >
                Siguiente
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="h-9 px-3 text-[12px] text-muted-foreground hover:text-foreground">Atrás</button>
              <button
                onClick={runImport}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium"
              >
                Importar
              </button>
            </>
          )}
          {step === 3 && (
            <button
              onClick={handleClose}
              disabled={importing}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-50"
            >
              {importing ? "Importando…" : "Cerrar"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
