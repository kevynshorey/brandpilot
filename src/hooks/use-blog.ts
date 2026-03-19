import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';

// --- Queries ---

export function useBlogPosts(status?: string) {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['blog-posts', activeWorkspace?.id, status],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const params = new URLSearchParams({ workspace_id: activeWorkspace.id });
      if (status) params.set('status', status);

      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error('Failed to fetch blog posts');
      const data = await res.json();
      return data.posts;
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useBlogPost(postId?: string) {
  return useQuery({
    queryKey: ['blog-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const res = await fetch(`/api/blog/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch blog post');
      const data = await res.json();
      return data.post;
    },
    enabled: !!postId,
  });
}

// --- Mutations ---

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: async (post: {
      title: string;
      slug?: string;
      content: string;
      excerpt?: string;
      meta_description?: string;
      featured_image_url?: string;
      tags?: string[];
      source_urls?: string[];
      source_images?: { url: string; alt: string; source?: string }[];
      ai_model?: string;
    }) => {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, workspace_id: activeWorkspace?.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create blog post');
      }
      return (await res.json()).post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update blog post');
      }
      return (await res.json()).post;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', data.id] });
    },
  });
}

export function usePublishBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to publish blog post');
      }
      return (await res.json()).post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete blog post');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

// --- AI Mutations ---

export function useResearchUrls() {
  return useMutation({
    mutationFn: async (urls: string[]) => {
      const res = await fetch('/api/ai/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'research_urls', urls }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Research failed');
      }
      return res.json();
    },
  });
}

export function useGenerateBlog() {
  const { activeWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: async (params: {
      topic: string;
      sourceContent?: string;
      keywords?: string;
      length?: 'short' | 'medium' | 'long';
      brandName?: string;
      brandVoice?: string;
      industry?: string;
    }) => {
      const res = await fetch('/api/ai/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_blog',
          ...params,
          workspaceId: activeWorkspace?.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Blog generation failed');
      }
      return res.json();
    },
  });
}

export function useGenerateIgPreview() {
  return useMutation({
    mutationFn: async (params: {
      blogTitle: string;
      blogExcerpt?: string;
      blogContent?: string;
      brandName?: string;
      brandVoice?: string;
    }) => {
      const res = await fetch('/api/ai/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_ig_preview', ...params }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'IG preview generation failed');
      }
      return res.json();
    },
  });
}
