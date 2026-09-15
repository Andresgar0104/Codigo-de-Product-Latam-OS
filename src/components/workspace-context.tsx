import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { Workspace } from "@/lib/mock-data";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useStore } from "@/components/deals-context";

interface Ctx {
  workspace: Workspace;
  workspaces: Workspace[];
  setWorkspace: (w: Workspace) => void;
  addWorkspace: (name: string) => Workspace;
}

const PALETTE = [
  "oklch(0.72 0.19 245)",
  "oklch(0.78 0.16 80)",
  "oklch(0.85 0.22 135)",
  "oklch(0.72 0.2 25)",
  "oklch(0.75 0.18 310)",
  "oklch(0.8 0.18 180)",
];

const FALLBACK_WS: Workspace = {
  id: "ws_fintoc", name: "Fintoc", client: "Fintoc",
  color: "oklch(0.72 0.19 245)", icp: "",
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspaces, addWorkspace: storeAdd } = useStore();
  const [activeId, setActiveId] = usePersistedState<string>("taltics_active_ws", "ws_fintoc");

  const workspace = useMemo(
    () => workspaces.find(w => w.id === activeId) ?? workspaces[0] ?? FALLBACK_WS,
    [workspaces, activeId]
  );

  const setWorkspace = useCallback((w: Workspace) => {
    setActiveId(w.id);
  }, [setActiveId]);

  const addWorkspace = useCallback((name: string) => {
    const trimmed = name.trim() || "Untitled";
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const w: Workspace = {
      id: `ws_${Date.now()}`,
      name: trimmed,
      client: trimmed,
      color,
      icp: "",
    };
    storeAdd(w);
    setActiveId(w.id);
    return w;
  }, [storeAdd, setActiveId]);

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaces, setWorkspace, addWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) return { workspace: FALLBACK_WS, workspaces: [FALLBACK_WS], setWorkspace: () => {}, addWorkspace: () => FALLBACK_WS };
  return ctx;
}
