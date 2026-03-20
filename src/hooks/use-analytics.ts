'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/stores/workspace-store';

export interface PostStats {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
  byPlatform: Record<string, number>;
  byContentType: Record<string, number>;
  publishedThisMonth: number;
  publishedLastMonth: number;
}

export function usePostStats() {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['post-stats', activeWorkspace?.id],
    queryFn: async (): Promise<PostStats> => {
      if (!activeWorkspace?.id) {
        return { total: 0, published: 0, scheduled: 0, draft: 0, failed: 0, byPlatform: {}, byContentType: {}, publishedThisMonth: 0, publishedLastMonth: 0 };
      }

      const supabase = createClient();
      const { data: posts, error } = await supabase
        .from('posts')
        .select('status, target_platforms, content_type, published_at, created_at')
        .eq('workspace_id', activeWorkspace.id);

      if (error || !posts) {
        return { total: 0, published: 0, scheduled: 0, draft: 0, failed: 0, byPlatform: {}, byContentType: {}, publishedThisMonth: 0, publishedLastMonth: 0 };
      }

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const byPlatform: Record<string, number> = {};
      const byContentType: Record<string, number> = {};
      let published = 0, scheduled = 0, draft = 0, failed = 0;
      let publishedThisMonth = 0, publishedLastMonth = 0;

      for (const post of posts) {
        // Status counts
        if (post.status === 'published') published++;
        else if (post.status === 'scheduled') scheduled++;
        else if (post.status === 'draft') draft++;
        else if (post.status === 'failed') failed++;

        // Platform counts
        const platforms = (post.target_platforms as string[]) || [];
        for (const p of platforms) {
          byPlatform[p] = (byPlatform[p] || 0) + 1;
        }

        // Content type counts
        const ct = (post.content_type as string) || 'single';
        byContentType[ct] = (byContentType[ct] || 0) + 1;

        // Monthly publishing
        const pubDate = post.published_at ? new Date(post.published_at as string) : null;
        if (pubDate && pubDate >= thisMonthStart) publishedThisMonth++;
        else if (pubDate && pubDate >= lastMonthStart && pubDate < thisMonthStart) publishedLastMonth++;
      }

      return {
        total: posts.length,
        published,
        scheduled,
        draft,
        failed,
        byPlatform,
        byContentType,
        publishedThisMonth,
        publishedLastMonth,
      };
    },
    enabled: !!activeWorkspace?.id,
  });
}

export interface TopPost {
  id: string;
  caption: string;
  status: string;
  target_platforms: string[];
  content_type: string;
  published_at: string | null;
  created_at: string;
  post_analytics: Array<{
    platform: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    engagement_rate: number;
  }>;
}

export function useTopPosts(limit = 5) {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['top-posts', activeWorkspace?.id, limit],
    queryFn: async (): Promise<TopPost[]> => {
      if (!activeWorkspace?.id) return [];
      const supabase = createClient();

      const { data, error } = await supabase
        .from('posts')
        .select('id, caption, status, target_platforms, content_type, published_at, created_at, post_analytics(*)')
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      // Sort by total engagement (likes + comments + shares)
      return (data as unknown as TopPost[]).sort((a, b) => {
        const engA = a.post_analytics.reduce((sum, pa) => sum + pa.likes + pa.comments + pa.shares, 0);
        const engB = b.post_analytics.reduce((sum, pa) => sum + pa.likes + pa.comments + pa.shares, 0);
        return engB - engA;
      });
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useAccountSnapshots() {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['account-snapshots', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const supabase = createClient();

      // Get social accounts for this workspace, with their latest snapshots
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('id, platform, account_name, is_active')
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_active', true);

      if (!accounts || accounts.length === 0) return [];

      const results = [];
      for (const account of accounts) {
        const { data: snapshots } = await supabase
          .from('analytics_snapshots')
          .select('*')
          .eq('social_account_id', account.id)
          .order('snapshot_date', { ascending: false })
          .limit(30);

        results.push({
          ...account,
          snapshots: snapshots || [],
        });
      }
      return results;
    },
    enabled: !!activeWorkspace?.id,
  });
}
