'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/stores/workspace-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  utm_campaign: string | null;
  goal: string | null;
  target_metrics: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  posts?: { count: number }[];
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useCampaigns(status?: string) {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['campaigns', activeWorkspace?.id, status],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const supabase = createClient();
      let query = supabase
        .from('campaigns')
        .select('*, posts(count)')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, posts(*, post_media(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      goal,
      startDate,
      endDate,
      utmCampaign,
    }: {
      name: string;
      description?: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
      utmCampaign?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          workspace_id: activeWorkspace.id,
          name,
          description: description || null,
          goal: goal || null,
          start_date: startDate || null,
          end_date: endDate || null,
          utm_campaign: utmCampaign || null,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      status?: CampaignStatus;
      goal?: string;
      start_date?: string;
      end_date?: string;
      utm_campaign?: string;
      target_metrics?: Record<string, unknown>;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      // First unassign all posts from this campaign
      await supabase.from('posts').update({ campaign_id: null }).eq('campaign_id', id);
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useAssignPostToCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, campaignId }: { postId: string; campaignId: string | null }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('posts')
        .update({ campaign_id: campaignId })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
