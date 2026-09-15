import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed, ok, fail } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create task",
  description: "Create a new task on an event.",
  inputSchema: {
    eventId: z.string(),
    title: z.string().min(1),
    status: z.enum(["todo", "doing", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueDate: z.string().optional().describe("ISO date yyyy-mm-dd"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ eventId, title, status, priority, dueDate }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabaseForUser(ctx)
      .from("tasks")
      .insert({ id, eventId, title, status: status ?? "todo", priority: priority ?? null, dueDate: dueDate ?? null })
      .select()
      .maybeSingle();
    return error ? fail(error.message) : ok(data);
  },
});
