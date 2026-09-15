import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-[12px] text-muted-foreground">Cargando…</div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) setError("Correo o contraseña incorrectos");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm"
      >
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold tracking-tight">Taltics</div>
          <div className="text-[12px] text-muted-foreground">GTM OS for LATAM</div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
          />
        </div>
        {error && (
          <div className="text-[12px] text-destructive">{error}</div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-9 rounded-md bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-50"
        >
          {submitting ? "Iniciando…" : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
