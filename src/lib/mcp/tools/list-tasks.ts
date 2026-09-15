import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description: "List tasks for an event.",
  inputSchema: {
    eventId: z.string(),
    status: z.enum(["todo", "doing", "done"]).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ eventId, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx).from("tasks").select("*").eq("eventId", eventId);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    return error ? fail(error.message) : ok(data);
  },
});
