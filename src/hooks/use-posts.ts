'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { assertPlanLimit } from '@/hooks/use-plan-limits';

export function usePosts(status?: string) {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['posts', activeWorkspace?.id, status],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const supabase = createClient();
      let query = supabase
        .from('posts')
        .select('*, post_media(*), campaigns(name)')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useScheduledPosts() {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['posts', 'scheduled', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*, post_media(*)')
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: async ({
      caption,
      hashtags,
      contentType,
      targetPlatforms,
      scheduledAt,
      campaignId,
      aiGenerated,
      aiPrompt,
      aiModel,
      aiImageModel,
      utmSource,
      utmMedium,
      utmCampaign,
    }: {
      caption: string;
      hashtags?: string[];
      contentType: string;
      targetPlatforms: string[];
      scheduledAt?: string;
      campaignId?: string;
      aiGenerated?: boolean;
      aiPrompt?: string;
      aiModel?: string;
      aiImageModel?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');

      // Enforce plan limit before creating
      await assertPlanLimit(activeWorkspace.id, 'posts');

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const status = scheduledAt ? 'scheduled' : 'draft';

      const { data, error } = await supabase
        .from('posts')
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          caption,
          hashtags: hashtags ?? [],
          content_type: contentType,
          target_platforms: targetPlatforms,
          status,
          scheduled_at: scheduledAt || null,
          campaign_id: campaignId || null,
          ai_generated: aiGenerated ?? false,
          ai_prompt: aiPrompt ?? null,
          ai_model: aiModel ?? null,
          ai_image_model: aiImageModel ?? null,
          utm_source: utmSource ?? null,
          utm_medium: utmMedium ?? null,
          utm_campaign: utmCampaign ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: string }) => {
      const supabase = createClient();
      const updates: Record<string, unknown> = { status };
      if (status === 'published') updates.published_at = new Date().toISOString();

      const { error } = await supabase.from('posts').update(updates).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}
