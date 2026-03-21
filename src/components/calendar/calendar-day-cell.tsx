'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DraggablePostCard, type CalendarPost } from './draggable-post-card';
import { Plus } from 'lucide-react';

interface CalendarDayCellProps {
  day: number | null;
  dateStr: string;
  isToday: boolean;
  posts: CalendarPost[];
  isLastCol: boolean;
  onQuickAdd: (dateStr: string) => void;
}

export function CalendarDayCell({ day, dateStr, isToday, posts, isLastCol, onQuickAdd }: CalendarDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr || `empty-${Math.random()}`,
    disabled: !day,
    data: { dateStr },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[100px] p-2 border-b border-r border-zinc-100 transition-colors group',
        day ? 'hover:bg-zinc-50' : 'bg-zinc-50/50',
        isLastCol && 'border-r-0',
        isOver && day && 'bg-amber-50 ring-2 ring-inset ring-amber-300',
      )}
    >
      {day && (
        <>
          <div className="flex items-center justify-between mb-1">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm',
                isToday ? 'bg-amber-500 text-white font-bold' : 'text-zinc-600'
              )}
            >
              {day}
            </div>
            <button
              onClick={() => onQuickAdd(dateStr)}
              className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-zinc-200 transition-all"
              title="Add post"
            >
              <Plus className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
          <div className="space-y-1">
            {posts.slice(0, 3).map((post) => (
              <DraggablePostCard key={post.id} post={post} />
            ))}
            {posts.length > 3 && (
              <p className="text-[10px] text-zinc-400 px-1">+{posts.length - 3} more</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
