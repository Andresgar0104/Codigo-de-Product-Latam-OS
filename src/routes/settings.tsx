import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-bits";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/use-my-profile";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Latam Leap" }] }),
  component: SettingsPage,
});

const tabs = ["Profile", "Team"] as const;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
  createdAt: string;
}

function SettingsPage() {
  const [tab, setTab] = useState<typeof tabs[number]>("Profile");

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Tu cuenta y equipo" />
      <div className="px-6 border-b border-border flex gap-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>
      <div className="p-6 max-w-3xl">
        {tab === "Profile" && <ProfileEditor />}
        {tab === "Team" && <TeamDirectory />}
      </div>
    </AppShell>
  );
}

function ProfileEditor() {
  const { profile, loading, refresh } = useMyProfile();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRole(profile.role);
    }
  }, [profile]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, role })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      console.error("[ProfileEditor] update error", error);
      return;
    }
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (loading && !profile) {
    return <div className="text-[12px] text-muted-foreground">Cargando…</div>;
  }
  if (!profile) {
    return <div className="text-[12px] text-muted-foreground">No se encontró tu perfil.</div>;
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-[13px] font-semibold">My profile</h2>
      <PField label="Name" value={name} onChange={setName} />
      <div>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
        <input
          value={profile.email}
          disabled
          className="mt-1 w-full h-9 px-3 text-[13px] bg-muted/40 border border-border rounded-md text-muted-foreground cursor-not-allowed"
        />
      </div>
      <PField label="Role" value={role} onChange={setRole} placeholder="e.g. Growth Partner" />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Save changes"}
        </button>
        {saved && <span className="text-[11px] text-[color:var(--success)]">Saved ✓</span>}
      </div>
    </div>
  );
}

function PField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full h-9 px-3 text-[13px] bg-card border border-border rounded-md focus:outline-none focus:border-ring"
      />
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? "").join("") || "?";
}

function TeamDirectory() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("createdAt", { ascending: true });
    if (error) {
      console.error("[Team] fetch error", error);
      setMembers([]);
      return;
    }
    setMembers(
      (data ?? []).map((r) => ({
        id: r.id,
        name: r.name ?? "",
        email: r.email ?? "",
        role: r.role ?? "",
        isOwner: Boolean((r as { isOwner?: boolean }).isOwner),
        createdAt: (r as { createdAt?: string }).createdAt ?? "",
      })),
    );
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {members === null ? (
          <div className="px-4 py-6 text-[12px] text-muted-foreground">Cargando…</div>
        ) : members.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-muted-foreground">Sin miembros todavía.</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-[11px] font-bold text-primary-foreground">
                {initials(m.name || m.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-medium truncate">{m.name || m.email}</div>
                  {m.isOwner && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-500 font-medium">
                      Owner
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>
              </div>
              <span className="text-[11px] text-muted-foreground">{m.role || "—"}</span>
            </div>
          ))
        )}
        <button
          onClick={() => setInviteOpen(true)}
          className="w-full text-left px-4 py-3 text-[12px] text-primary hover:bg-muted/30 border-t border-border"
        >
          + Invite member
        </button>
      </div>
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onCreated={load} />
    </>
  );
}

function InviteDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; name: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName(""); setEmail(""); setRole("");
    setError(null); setResult(null); setCopied(false); setSubmitting(false);
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  async function submit() {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Nombre y correo son obligatorios");
      return;
    }
    setSubmitting(true);
    const { data, error: fnErr } = await supabase.functions.invoke("invite-team-member", {
      body: { email: email.trim(), name: name.trim(), role: role.trim() },
    });
    setSubmitting(false);
    if (fnErr) {
      setError(fnErr.message || "Error al enviar la invitación");
      return;
    }
    const res = data as { success: boolean; tempPassword?: string; error?: string };
    if (!res?.success) {
      setError(res?.error || "Error al crear el usuario");
      return;
    }
    setResult({ email: email.trim(), name: name.trim(), tempPassword: res.tempPassword! });
    onCreated();
  }

  async function copyPw() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{result ? "Invitación creada" : "Invitar miembro"}</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <PField label="Nombre *" value={name} onChange={setName} />
            <PField label="Correo *" value={email} onChange={setEmail} placeholder="persona@empresa.com" />
            <PField label="Puesto" value={role} onChange={setRole} placeholder="Growth Partner, Analista…" />
            {error && (
              <div className="text-[12px] text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <DialogFooter>
              <button
                onClick={submit}
                disabled={submitting}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-60"
              >
                {submitting ? "Enviando…" : "Enviar invitación"}
              </button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-foreground">
              Cuenta creada para <span className="font-semibold">{result.name}</span>. Comparte estas credenciales para que pueda iniciar sesión:
            </p>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Correo</div>
              <div className="font-mono text-[12px]">{result.email}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Contraseña temporal</div>
                <button
                  onClick={copyPw}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Copiada" : "Copiar"}
                </button>
              </div>
              <div className="font-mono text-[13px] mt-1 select-all">{result.tempPassword}</div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Esta contraseña no se volverá a mostrar — cópiala ahora.
            </p>
            <DialogFooter>
              <button
                onClick={close}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium"
              >
                Listo
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
