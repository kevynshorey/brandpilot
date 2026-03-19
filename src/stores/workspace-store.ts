import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color_primary: string;
  brand_color_secondary: string;
  industry: string | null;
}

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: null,
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
    }),
    { name: 'brandpilot-workspace' }
  )
);
