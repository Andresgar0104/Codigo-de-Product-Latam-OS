import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, CalendarDays, Users, KanbanSquare,
  Settings, ChevronsUpDown, Plus, Building2,
} from "lucide-react";
import { useWorkspace } from "@/components/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/use-my-profile";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? "").join("") || "?";
}

function SidebarProfile() {
  const { profile, loading } = useMyProfile();

  if (loading && !profile) {
    return (
      <div className="w-full flex items-center gap-2.5 px-2 py-1.5">
        <div className="size-8 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="h-3 bg-muted rounded animate-pulse w-20 mb-1" />
          <div className="h-2 bg-muted rounded animate-pulse w-12" />
        </div>
      </div>
    );
  }

  const name = profile?.name || profile?.email || "—";
  const role = profile?.role || "—";
  const email = profile?.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-left">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-[11px] font-bold text-primary-foreground shrink-0">
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold leading-tight truncate text-sidebar-foreground">{name}</div>
            <div className="text-[11px] text-muted-foreground leading-tight truncate">{role}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <div className="text-[13px] font-semibold leading-tight">{name}</div>
          <div className="text-[11px] text-muted-foreground leading-tight font-normal">{email}</div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
            {role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => { supabase.auth.signOut(); }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { workspace: ws, workspaces, setWorkspace, addWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");

  function createAccount() {
    if (!newName.trim()) return;
    addWorkspace(newName.trim());
    setNewName("");
    setNewOpen(false);
    setOpen(false);
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-3 border-b border-sidebar-border">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-left"
          >
            <div className="size-7 rounded-md grid place-items-center text-[11px] font-bold text-primary-foreground" style={{ background: ws.color }}>
              {ws.client[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-sidebar-foreground truncate">{ws.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{ws.client} · Account</div>
            </div>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </button>
          {open && (
            <div className="mt-1 border border-sidebar-border rounded-md bg-popover overflow-hidden">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => { setWorkspace(w); setOpen(false); }}
                  className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-left text-[12px] hover:bg-sidebar-accent",
                    w.id === ws.id && "bg-sidebar-accent")}
                >
                  <div className="size-5 rounded grid place-items-center text-[10px] font-bold" style={{ background: w.color, color: "oklch(0.15 0.02 250)" }}>{w.client[0]}</div>
                  <span className="flex-1 truncate text-sidebar-foreground">{w.name}</span>
                </button>
              ))}
              <button
                onClick={() => setNewOpen(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-sidebar-accent border-t border-sidebar-border"
              >
                <Plus className="size-3.5" /> New account
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => {
            const active = end ? path === to : path.startsWith(to);
            const isEvents = to === "/events";
            const eventsExpanded = path.startsWith("/events") || path.startsWith("/venues") || path.startsWith("/tareas");
            return (
              <div key={to}>
                <Link to={to}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors",
                    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}>
                  <Icon className="size-4" />
                  <span>{label}</span>
                </Link>
                {isEvents && eventsExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                    <Link to="/events"
                      className={cn(
                        "block px-2 py-1 rounded-md text-[12px] transition-colors",
                        path === "/events" || path.startsWith("/events/")
                          ? "bg-sidebar-accent/60 text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                      )}>Eventos</Link>
                    <Link to="/venues"
                      className={cn(
                        "block px-2 py-1 rounded-md text-[12px] transition-colors",
                        path.startsWith("/venues")
                          ? "bg-sidebar-accent/60 text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                      )}>Venues</Link>
                    <Link to="/tareas"
                      className={cn(
                        "block px-2 py-1 rounded-md text-[12px] transition-colors",
                        path.startsWith("/tareas")
                          ? "bg-sidebar-accent/60 text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                      )}>Tareas</Link>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border mt-auto">
          <SidebarProfile />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto">{children}</div>
      </main>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nombre *</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createAccount(); }}
              className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:border-ring"
            />
          </div>
          <DialogFooter>
            <button onClick={createAccount} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium">Crear</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
