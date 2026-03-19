'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePosts } from '@/hooks/use-posts';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
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
} from 'lucide-react';

type PostStatus = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';

const DEMO_POSTS = [
  { id: '1', caption: 'Launch announcement — LaunchPath is live! Guide your startup from concept to capital.', status: 'scheduled', platforms: ['instagram', 'linkedin'], contentType: 'single', scheduledAt: '2026-03-20T09:00', createdAt: '2026-03-17', hasImage: true },
  { id: '2', caption: 'Did you know? 72% of startups fail because they lack structured investor preparation.', status: 'scheduled', platforms: ['linkedin', 'twitter'], contentType: 'carousel', scheduledAt: '2026-03-22T14:00', createdAt: '2026-03-17', hasImage: true },
  { id: '3', caption: 'Our Investment Readiness Score helps you understand exactly where you stand.', status: 'published', platforms: ['linkedin'], contentType: 'single', scheduledAt: null, createdAt: '2026-03-15', hasImage: true },
  { id: '4', caption: 'Building a pitch deck? Here are the 5 slides every investor wants to see.', status: 'draft', platforms: ['instagram'], contentType: 'carousel', scheduledAt: null, createdAt: '2026-03-16', hasImage: false },
  { id: '5', caption: 'Meet the 8-phase framework that takes you from idea to funded venture.', status: 'failed', platforms: ['instagram', 'linkedin'], contentType: 'single', scheduledAt: '2026-03-14T10:00', createdAt: '2026-03-13', hasImage: true },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-600', icon: FileText },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700', icon: Clock },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

export default function PostsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [filter, setFilter] = useState<PostStatus>('all');
  const [search, setSearch] = useState('');

  const filteredPosts = DEMO_POSTS.filter((post) => {
    if (filter !== 'all' && post.status !== filter) return false;
    if (search && !post.caption.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: DEMO_POSTS.length,
    draft: DEMO_POSTS.filter((p) => p.status === 'draft').length,
    scheduled: DEMO_POSTS.filter((p) => p.status === 'scheduled').length,
    published: DEMO_POSTS.filter((p) => p.status === 'published').length,
    failed: DEMO_POSTS.filter((p) => p.status === 'failed').length,
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
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No posts found</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const config = statusConfig[post.status];
            const StatusIcon = config.icon;
            return (
              <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  {post.hasImage ? (
                    <ImageIcon className="w-6 h-6 text-zinc-400" />
                  ) : (
                    <FileText className="w-6 h-6 text-zinc-300" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 line-clamp-1">{post.caption}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {/* Platforms */}
                    <div className="flex items-center gap-1">
                      {post.platforms.map((p) => {
                        const Icon = platformIcons[p];
                        return Icon ? <Icon key={p} className="w-3.5 h-3.5 text-zinc-400" /> : null;
                      })}
                    </div>
                    {/* Type */}
                    <span className="text-xs text-zinc-400">{post.contentType}</span>
                    {/* Date */}
                    {post.scheduledAt && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', config.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>

                {/* Actions */}
                <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
                  <MoreVertical className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
