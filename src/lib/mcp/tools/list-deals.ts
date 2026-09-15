import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "list_deals",
  title: "List pipeline deals",
  description: "List deals in a workspace, optionally filtered by stage.",
  inputSchema: {
    workspaceId: z.string(),
    stage: z.string().optional().describe("Optional pipeline stage filter."),
    limit: z.number().int().positive().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspaceId, stage, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("deals")
      .select("*")
      .eq("workspaceId", workspaceId)
      .limit(limit ?? 200);
    if (stage) q = q.eq("stage", stage);
    const { data, error } = await q;
    return error ? fail(error.message) : ok(data);
  },
});
