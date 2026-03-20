'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';

export interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
  platform_account_id: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export function useSocialAccounts() {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['social-accounts', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const res = await fetch(`/api/social/accounts?workspace_id=${activeWorkspace.id}`);
      if (!res.ok) throw new Error('Failed to fetch social accounts');
      const data = await res.json();
      return data.accounts as SocialAccount[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useConnectSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspace_id: string;
      platform: string;
      account_name: string;
      platform_account_id?: string;
      access_token?: string;
      refresh_token?: string;
      token_expires_at?: string;
    }) => {
      const res = await fetch('/api/social/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to connect account');
      }
      return (await res.json()).account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}

export function useDisconnectSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/social/accounts?id=${accountId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to disconnect account');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Publishing failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
