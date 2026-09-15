import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "list_workspaces",
  title: "List accounts (workspaces)",
  description: "List the accounts (workspaces) the signed-in user has access to.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx).from("workspaces").select("*");
    return error ? fail(error.message) : ok(data);
  },
});
