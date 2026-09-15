import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "add_touchpoint",
  title: "Add pipeline touchpoint",
  description: "Log a touchpoint (activity note) on a deal.",
  inputSchema: {
    dealId: z.string(),
    note: z.string().min(1),
    kind: z.string().optional().describe("Free-form kind label, e.g. call, email, meeting."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ dealId, note, kind }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const id = `tp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabaseForUser(ctx)
      .from("touchpoints")
      .insert({ id, dealId, note, kind: kind ?? null, createdAt: new Date().toISOString() })
      .select()
      .maybeSingle();
    return error ? fail(error.message) : ok(data);
  },
});
