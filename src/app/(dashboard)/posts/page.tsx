'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePosts, useDeletePost, useUpdatePostStatus } from '@/hooks/use-posts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Instagram,
  Linkedin,
  Twitter,
  MoreVertical,
  Calendar,
  Image as ImageIcon,
  Trash2,
  Send,
  Loader2,
  Pin,
} from 'lucide-react';

type PostStatus = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-600', icon: FileText },
  pending_approval: { label: 'Pending', color: 'bg-blue-100 text-blue-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle2 },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700', icon: Clock },
  publishing: { label: 'Publishing', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  archived: { label: 'Archived', color: 'bg-zinc-100 text-zinc-500', icon: FileText },
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  pinterest: Pin,
};

export default function PostsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: posts = [], isLoading } = usePosts();
  const deletePost = useDeletePost();
  const updateStatus = useUpdatePostStatus();
  const [filter, setFilter] = useState<PostStatus>('all');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter((post: Record<string, unknown>) => {
      const status = post.status as string;
      if (filter !== 'all' && status !== filter) return false;
      if (search && !(post.caption as string || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, filter, search]);

  const counts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter((p: Record<string, unknown>) => p.status === 'draft').length,
    scheduled: posts.filter((p: Record<string, unknown>) => p.status === 'scheduled').length,
    published: posts.filter((p: Record<string, unknown>) => p.status === 'published').length,
    failed: posts.filter((p: Record<string, unknown>) => p.status === 'failed').length,
  }), [posts]);

  const handleDelete = async (postId: string) => {
    setMenuOpen(null);
    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handlePublishNow = async (postId: string) => {
    setMenuOpen(null);
    try {
      await updateStatus.mutateAsync({ postId, status: 'published' });
      toast.success('Post published!');
    } catch {
      toast.error('Failed to publish post');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Posts</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'All workspaces'} — {counts.all} total posts</p>
        </div>
        <Link href="/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
          {(['all', 'draft', 'scheduled', 'published', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === status ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {status === 'all' ? 'All' : statusConfig[status].label}
              <span className="ml-1 text-[10px] opacity-60">{counts[status]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-zinc-300 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-zinc-500">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              {posts.length === 0 ? 'No posts yet — create your first one!' : 'No posts match your filters'}
            </p>
            {posts.length === 0 && (
              <Link href="/create" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors">
                <Plus className="w-4 h-4" /> Create Post
              </Link>
            )}
          </div>
        ) : (
          filteredPosts.map((post: Record<string, unknown>) => {
            const status = post.status as string;
            const config = statusConfig[status] || statusConfig.draft;
            const StatusIcon = config.icon;
            const platforms = (post.target_platforms as string[]) || [];
            const media = (post.post_media as Record<string, unknown>[]) || [];
            const hasImage = media.length > 0;
            const scheduledAt = post.scheduled_at as string | null;
            const postId = post.id as string;

            return (
              <div key={postId} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {hasImage && media[0] && (media[0] as Record<string, unknown>).media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(media[0] as Record<string, unknown>).media_url as string}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : hasImage ? (
                    <ImageIcon className="w-6 h-6 text-zinc-400" />
                  ) : (
                    <FileText className="w-6 h-6 text-zinc-300" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 line-clamp-1">{post.caption as string}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      {platforms.map((p) => {
                        const Icon = platformIcons[p];
                        return Icon ? <Icon key={p} className="w-3.5 h-3.5 text-zinc-400" /> : null;
                      })}
                    </div>
                    <span className="text-xs text-zinc-400">{(post.content_type as string || 'single').replace(/_/g, ' ')}</span>
                    {scheduledAt && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', config.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === postId ? null : postId)}
                    className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-zinc-400" />
                  </button>
                  {menuOpen === postId && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg border border-zinc-200 shadow-lg py-1">
                        {status === 'draft' && (
                          <button
                            onClick={() => handlePublishNow(postId)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                          >
                            <Send className="w-3.5 h-3.5" /> Publish Now
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(postId)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
