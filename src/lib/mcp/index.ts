import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWorkspaces from "./tools/list-workspaces";
import listCompanies from "./tools/list-companies";
import listContacts from "./tools/list-contacts";
import listDeals from "./tools/list-deals";
import listEvents from "./tools/list-events";
import listTasks from "./tools/list-tasks";
import createTask from "./tools/create-task";
import addTouchpoint from "./tools/add-touchpoint";

// The OAuth issuer MUST be the direct Supabase host. On publish, SUPABASE_URL
// is rewritten to the `.lovable.cloud` proxy, which mcp-js rejects (RFC 8414
// issuer mismatch). The project ref is the only Supabase value that survives
// publish unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "taltics-mcp",
  title: "Taltics GTM",
  version: "0.1.0",
  instructions:
    "GTM operating system for LATAM. Read accounts (workspaces), companies, contacts, pipeline deals, events, and tasks; create tasks and log pipeline touchpoints as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listWorkspaces,
    listCompanies,
    listContacts,
    listDeals,
    listEvents,
    listTasks,
    createTask,
    addTouchpoint,
  ],
});
