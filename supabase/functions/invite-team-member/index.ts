// Invite a team member: creates an auth user with a temp password and
// inserts their profile row. Requires service role (bypasses RLS).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function genPassword(len = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  try {
    const { email, name, role } = await req.json();

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return json(400, { success: false, error: "Correo inválido" });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return json(400, { success: false, error: "El nombre es obligatorio" });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const tempPassword = genPassword(12);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        msg.includes("duplicate")
      ) {
        return json(200, { success: false, error: "Ya existe un usuario con ese correo" });
      }
      return json(200, {
        success: false,
        error: createErr?.message || "No se pudo crear el usuario",
      });
    }

    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id,
      name: name.trim(),
      email,
      role: (role || "").trim(),
      isOwner: false,
      status: "active",
    });

    if (profileErr) {
      // Roll back the auth user so the invite can be retried cleanly.
      await admin.auth.admin.deleteUser(created.user.id);
      return json(200, { success: false, error: profileErr.message });
    }

    return json(200, { success: true, tempPassword });
  } catch (err) {
    return json(200, {
      success: false,
      error: err instanceof Error ? err.message : "Error inesperado",
    });
  }
});
