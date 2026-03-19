'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { data: workspaces, isLoading } = useWorkspaces();

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!activeWorkspace && workspaces && workspaces.length > 0) {
      setActiveWorkspace(workspaces[0]);
    }
  }, [workspaces, activeWorkspace, setActiveWorkspace]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
        <span className="text-sm text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="px-3 py-2.5">
        <p className="text-xs text-zinc-500">No workspaces yet</p>
      </div>
    );
  }

  const current = activeWorkspace || workspaces[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: current.brand_color_primary || '#000' }}
        >
          {current.name[0]}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white truncate">{current.name}</p>
          <p className="text-xs text-zinc-500 truncate">{current.industry || 'No industry set'}</p>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                setActiveWorkspace(ws);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors',
                current.id === ws.id && 'bg-zinc-800'
              )}
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: ws.brand_color_primary || '#000' }}
              >
                {ws.name[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm text-white truncate">{ws.name}</p>
              </div>
            </button>
          ))}
          <div className="border-t border-zinc-700">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
