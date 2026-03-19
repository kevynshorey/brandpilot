'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBlogPosts, useDeleteBlogPost } from '@/hooks/use-blog';
import { toast } from 'sonner';
import {
  BookOpen,
  Loader2,
  Plus,
  ChevronDown,
  Trash2,
  Edit3,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { STATUS_OPTIONS } from './constants';

interface BlogListViewProps {
  onCreateNew: () => void;
  onEditPost: (post: Record<string, unknown>) => void;
}

export function BlogListView({ onCreateNew, onEditPost }: BlogListViewProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteBlogPost = useDeleteBlogPost();

  const { data: blogPosts = [], isLoading: postsLoading } = useBlogPosts(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteBlogPost.mutateAsync(id);
      setDeleteConfirmId(null);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Blog</h1>
          <p className="text-sm text-zinc-500">
            {activeWorkspace?.name || 'Select a workspace'} — Manage blog posts and generate new content
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      {/* Tabs + Filter */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-zinc-900">My Posts</span>
            <span className="text-xs text-zinc-400 ml-1">({blogPosts.length})</span>
          </div>

          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5"
            >
              {STATUS_OPTIONS.find(s => s.id === statusFilter)?.label || 'All Posts'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setStatusFilter(opt.id); setShowStatusDropdown(false); }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 transition-colors',
                      statusFilter === opt.id ? 'text-amber-700 font-medium bg-amber-50' : 'text-zinc-600'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts table */}
        {postsLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-300 animate-spin mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Loading posts...</p>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No blog posts yet</p>
            <p className="text-xs text-zinc-400 mt-1">Create your first blog post to get started</p>
            <button
              onClick={onCreateNew}
              className="mt-4 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Title</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tags</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Published</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts.map((post: Record<string, unknown>) => (
                  <tr
                    key={post.id as string}
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 cursor-pointer transition-colors"
                    onClick={() => onEditPost(post)}
                  >
                    <td className="py-3 px-3">
                      <p className="font-medium text-zinc-900 truncate max-w-[280px]">
                        {(post.title as string) || 'Untitled'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate max-w-[280px]">
                        /{(post.slug as string) || ''}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={(post.status as string) || 'draft'} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {((post.tags as string[]) || []).slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                        {((post.tags as string[]) || []).length > 3 && (
                          <span className="text-xs text-zinc-400">+{((post.tags as string[]) || []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-500">
                      {post.published_at
                        ? new Date(post.published_at as string).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onEditPost(post)}
                          className="p-1.5 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === (post.id as string) ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(post.id as string)}
                              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs font-medium text-zinc-500 bg-zinc-50 rounded hover:bg-zinc-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(post.id as string)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
