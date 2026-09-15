import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "List events",
  description: "List events in a workspace.",
  inputSchema: {
    workspaceId: z.string(),
    status: z.enum(["upcoming", "past", "cancelled"]).optional(),
    limit: z.number().int().positive().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspaceId, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("events")
      .select("*")
      .eq("workspaceId", workspaceId)
      .limit(limit ?? 100);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    return error ? fail(error.message) : ok(data);
  },
});
