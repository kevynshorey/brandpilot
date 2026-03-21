'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-200 text-zinc-600',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  publishing: 'bg-amber-100 text-amber-700',
  pending_approval: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
};

export interface CalendarPost {
  id: string;
  caption: string;
  status: string;
  platforms: string[];
}

export function DraggablePostCard({ post }: { post: CalendarPost }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium truncate cursor-grab active:cursor-grabbing transition-shadow',
        statusColors[post.status] || 'bg-zinc-100 text-zinc-600',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-amber-400/50 z-50',
      )}
      title={post.caption}
    >
      {post.caption || 'Untitled'}
    </div>
  );
}
