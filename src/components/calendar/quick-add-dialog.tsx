'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePost } from '@/hooks/use-posts';

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'twitter', 'pinterest', 'tiktok'];

interface QuickAddDialogProps {
  open: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
}

export function QuickAddDialog({ open, onClose, date }: QuickAddDialogProps) {
  const createPost = useCreatePost();
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || selectedPlatforms.length === 0) return;

    try {
      await createPost.mutateAsync({
        caption: caption.trim(),
        contentType: 'single',
        targetPlatforms: selectedPlatforms,
        scheduledAt: `${date}T09:00:00`,
      });
      toast.success('Post scheduled');
      setCaption('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  if (!open) return null;

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Quick Add Post</h2>
            <p className="text-xs text-zinc-500">{displayDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption..."
              rows={3}
              required
              maxLength={2200}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    selectedPlatforms.includes(p)
                      ? 'bg-amber-500 text-zinc-900'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPost.isPending || !caption.trim() || selectedPlatforms.length === 0}
              className="px-4 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createPost.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Schedule Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
