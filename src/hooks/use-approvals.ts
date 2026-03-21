'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/stores/workspace-store';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface ApprovalRequest {
  id: string;
  post_id: string;
  requested_by: string;
  assigned_to: string | null;
  status: ApprovalStatus;
  notes: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  posts?: {
    id: string;
    caption: string;
    status: string;
    content_type: string;
    target_platforms: string[];
    post_media?: { url: string }[];
  };
  requester?: { full_name: string; email: string };
  reviewer?: { full_name: string; email: string };
}

export function useApprovalRequests(status?: string) {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['approvals', activeWorkspace?.id, status],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const supabase = createClient();

      let query = supabase
        .from('approval_requests')
        .select(`
          *,
          posts!inner(id, caption, status, content_type, target_platforms, workspace_id, post_media(url)),
          requester:profiles!approval_requests_requested_by_fkey(full_name, email),
          reviewer:profiles!approval_requests_assigned_to_fkey(full_name, email)
        `)
        .eq('posts.workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data ?? []) as ApprovalRequest[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, notes }: { postId: string; notes?: string }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update post status to pending_approval
      await supabase.from('posts').update({ status: 'pending_approval' }).eq('id', postId);

      // Create approval request
      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          post_id: postId,
          requested_by: user.id,
          status: 'pending',
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useReviewApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      approvalId,
      postId,
      decision,
      notes,
    }: {
      approvalId: string;
      postId: string;
      decision: 'approved' | 'rejected' | 'revision_requested';
      notes?: string;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update approval request
      const { error: approvalError } = await supabase
        .from('approval_requests')
        .update({
          status: decision,
          assigned_to: user.id,
          notes: notes || null,
          decided_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // Update post status based on decision
      const postStatus = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'draft' : 'draft';
      await supabase.from('posts').update({ status: postStatus }).eq('id', postId);

      return { decision };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
