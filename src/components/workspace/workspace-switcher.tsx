'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Loader2, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useWorkspaces, useCreateWorkspace } from '@/hooks/use-workspaces';
import { useOrganization } from '@/hooks/use-user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { data: org } = useOrganization();
  const createWorkspace = useCreateWorkspace();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!activeWorkspace && workspaces && workspaces.length > 0) {
      setActiveWorkspace(workspaces[0]);
    }
  }, [workspaces, activeWorkspace, setActiveWorkspace]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSwitch = (ws: Record<string, unknown>) => {
    setActiveWorkspace(ws as never);
    setOpen(false);

    // Invalidate all workspace-scoped queries to prevent stale data
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['brand-guidelines'] });
    queryClient.invalidateQueries({ queryKey: ['post-stats'] });
    queryClient.invalidateQueries({ queryKey: ['top-posts'] });
    queryClient.invalidateQueries({ queryKey: ['account-snapshots'] });
  };

  const handleCreate = async () => {
    if (!newName.trim() || !org) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const workspace = await createWorkspace.mutateAsync({
        name: newName.trim(),
        slug,
        orgId: (org as { id: string }).id,
      });
      setActiveWorkspace(workspace);
      setCreating(false);
      setNewName('');
      setOpen(false);
      toast.success(`${workspace.name} created!`);
      router.push('/dashboard');
    } catch {
      toast.error('Failed to create workspace');
    }
  };

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); setCreating(false); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
      >
        {current.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: current.brand_color_primary || '#000' }}
          >
            {current.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white truncate">{current.name}</p>
          <p className="text-xs text-zinc-500 truncate">{current.industry || 'No industry set'}</p>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Workspace list */}
          <div className="max-h-60 overflow-y-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSwitch(ws)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors',
                  current.id === ws.id && 'bg-zinc-800'
                )}
              >
                {ws.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ws.logo_url} alt="" className="w-7 h-7 rounded object-cover" />
                ) : (
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: ws.brand_color_primary || '#000' }}
                  >
                    {ws.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-white truncate">{ws.name}</p>
                  {ws.industry && <p className="text-xs text-zinc-500 truncate">{ws.industry}</p>}
                </div>
                {current.id === ws.id && (
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Create new workspace */}
          <div className="border-t border-zinc-700">
            {creating ? (
              <div className="p-3 space-y-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Brand name..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCreating(false); setNewName(''); }}
                    className="flex-1 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || createWorkspace.isPending}
                    className="flex-1 px-3 py-1.5 bg-amber-500 text-zinc-900 rounded-lg text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {createWorkspace.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Workspace</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
