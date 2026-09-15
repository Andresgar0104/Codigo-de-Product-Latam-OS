import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "list_companies",
  title: "List companies",
  description: "List companies in a workspace.",
  inputSchema: {
    workspaceId: z.string().describe("Workspace/account id to filter by."),
    search: z.string().optional().describe("Optional case-insensitive name filter."),
    limit: z.number().int().positive().optional().describe("Max rows (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspaceId, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("companies")
      .select("*")
      .eq("workspaceId", workspaceId)
      .limit(limit ?? 100);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    return error ? fail(error.message) : ok(data);
  },
});
