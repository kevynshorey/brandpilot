'use client';

import { useState } from 'react';
import { X, Loader2, Check, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePosts } from '@/hooks/use-posts';
import { useAssignPostToCampaign } from '@/hooks/use-campaigns';

interface PostPickerDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
}

export function PostPickerDialog({ open, onClose, campaignId }: PostPickerDialogProps) {
  const { data: posts = [], isLoading } = usePosts();
  const assignPost = useAssignPostToCampaign();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Only show posts not already assigned to a campaign
  const unassignedPosts = posts.filter(
    (p: { campaign_id: string | null }) => !p.campaign_id
  );

  const togglePost = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((postId) =>
          assignPost.mutateAsync({ postId, campaignId })
        )
      );
      toast.success(`${selectedIds.size} post${selectedIds.size === 1 ? '' : 's'} assigned`);
      setSelectedIds(new Set());
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign posts');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900">Add Posts to Campaign</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            </div>
          ) : unassignedPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-500">No unassigned posts available.</p>
              <p className="text-xs text-zinc-400 mt-1">Create posts first, then assign them here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unassignedPosts.map((post: { id: string; caption: string; status: string; content_type: string; target_platforms: string[]; post_media?: { url: string }[] }) => (
                <button
                  key={post.id}
                  onClick={() => togglePost(post.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    selectedIds.has(post.id)
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    selectedIds.has(post.id)
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-zinc-300'
                  }`}>
                    {selectedIds.has(post.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="w-10 h-10 rounded bg-zinc-100 flex items-center justify-center shrink-0">
                    {post.post_media?.[0]?.url ? (
                      <img src={post.post_media[0].url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 line-clamp-1">{post.caption || 'Untitled post'}</p>
                    <p className="text-xs text-zinc-400">
                      {post.content_type} · {post.status} · {post.target_platforms?.join(', ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {unassignedPosts.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
            <p className="text-xs text-zinc-500">{selectedIds.size} selected</p>
            <button
              onClick={handleAssign}
              disabled={selectedIds.size === 0 || assignPost.isPending}
              className="px-4 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {assignPost.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Assign {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
