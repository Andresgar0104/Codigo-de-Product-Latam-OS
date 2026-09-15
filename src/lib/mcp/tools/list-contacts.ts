import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "list_contacts",
  title: "List contacts",
  description: "List contacts in a workspace, optionally filtered by company or search term.",
  inputSchema: {
    workspaceId: z.string(),
    companyId: z.string().optional(),
    search: z.string().optional().describe("Match on name or email (ilike)."),
    limit: z.number().int().positive().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspaceId, companyId, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("contacts")
      .select("*")
      .eq("workspaceId", workspaceId)
      .limit(limit ?? 100);
    if (companyId) q = q.eq("companyId", companyId);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error } = await q;
    return error ? fail(error.message) : ok(data);
  },
});
