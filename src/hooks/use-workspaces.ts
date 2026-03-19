'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      if (error) {
        console.error('Workspaces fetch error:', error);
        return [];
      }
      return data ?? [];
    },
  });
}

export function useBrandGuidelines(workspaceId?: string) {
  return useQuery({
    queryKey: ['brand-guidelines', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, slug, industry, brandColor, orgId }: {
      name: string; slug: string; industry?: string; brandColor?: string; orgId: string;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          org_id: orgId,
          name,
          slug,
          industry: industry ?? null,
          brand_color_primary: brandColor ?? '#000000',
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-create brand guidelines
      await supabase.from('brand_guidelines').insert({ workspace_id: data.id });

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}
