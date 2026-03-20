'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { assertPlanLimit } from '@/hooks/use-plan-limits';

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

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      industry?: string | null;
      brand_color_primary?: string;
      brand_color_secondary?: string;
      logo_url?: string | null;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateBrandGuidelines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, ...updates }: {
      workspaceId: string;
      tone_of_voice?: string | null;
      writing_style?: string | null;
      topics_to_cover?: string[];
      topics_to_avoid?: string[];
      hashtag_sets?: Record<string, string[]>;
      example_captions?: string[];
      color_palette?: Array<{ name: string; hex: string }>;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brand_guidelines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brand-guidelines', variables.workspaceId] });
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, slug, industry, brandColor, orgId, workspaceId }: {
      name: string; slug: string; industry?: string; brandColor?: string; orgId: string; workspaceId?: string;
    }) => {
      // Enforce plan limit — need any workspace ID for the check
      if (workspaceId) {
        await assertPlanLimit(workspaceId, 'workspaces');
      }

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
