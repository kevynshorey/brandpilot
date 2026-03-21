import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';

interface Asset {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: 'image' | 'video';
  mime_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  tags: string[];
  created_at: string;
}

export function useAssets() {
  const { activeWorkspace } = useWorkspaceStore();
  return useQuery<Asset[]>({
    queryKey: ['assets', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const resp = await fetch(`/api/assets?workspace_id=${activeWorkspace.id}`);
      if (!resp.ok) throw new Error('Failed to load assets');
      return resp.json();
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: async ({ file, tags }: { file: File; tags?: string[] }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', activeWorkspace.id);
      if (tags?.length) formData.append('tags', tags.join(','));

      const resp = await fetch('/api/assets', { method: 'POST', body: formData });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const resp = await fetch(`/api/assets?id=${assetId}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Delete failed');
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
