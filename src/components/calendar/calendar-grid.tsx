'use client';

import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUpdatePost } from '@/hooks/use-posts';
import { CalendarDayCell } from './calendar-day-cell';
import type { CalendarPost } from './draggable-post-card';

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-200 text-zinc-600',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

interface CalendarGridProps {
  cells: Array<{ day: number | null; dateStr: string }>;
  postsByDate: Record<string, CalendarPost[]>;
  todayStr: string;
  onQuickAdd: (dateStr: string) => void;
}

export function CalendarGrid({ cells, postsByDate, todayStr, onQuickAdd }: CalendarGridProps) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceStore();
  const updatePost = useUpdatePost();
  const [activePost, setActivePost] = useState<CalendarPost | null>(null);

  // Require 8px movement before starting drag (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const post = event.active.data.current?.post as CalendarPost | undefined;
    setActivePost(post ?? null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePost(null);
    const { active, over } = event;
    if (!over || !activeWorkspace?.id) return;

    const postId = active.id as string;
    const targetDateStr = over.data.current?.dateStr as string | undefined;
    if (!targetDateStr) return;

    // Don't update if dropped on the same day
    const post = active.data.current?.post as CalendarPost;
    if (!post) return;

    const newScheduledAt = `${targetDateStr}T09:00:00`;

    // Optimistic update — move the post in the cache immediately
    queryClient.setQueryData(
      ['posts', activeWorkspace.id, undefined],
      (old: Record<string, unknown>[] | undefined) => {
        if (!old) return old;
        return old.map((p) =>
          (p.id as string) === postId
            ? { ...p, scheduled_at: newScheduledAt, status: p.status === 'draft' ? 'scheduled' : p.status }
            : p
        );
      }
    );

    updatePost.mutate(
      {
        postId,
        updates: {
          scheduled_at: newScheduledAt,
          ...(post.status === 'draft' ? { status: 'scheduled' } : {}),
        },
      },
      {
        onError: () => {
          // Revert: refetch from server
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          toast.error('Failed to reschedule post');
        },
        onSuccess: () => {
          toast.success('Post rescheduled');
        },
      }
    );
  }, [activeWorkspace?.id, queryClient, updatePost]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dayPosts = cell.dateStr ? postsByDate[cell.dateStr] || [] : [];
          return (
            <CalendarDayCell
              key={cell.dateStr || `empty-${i}`}
              day={cell.day}
              dateStr={cell.dateStr}
              isToday={cell.dateStr === todayStr}
              posts={dayPosts}
              isLastCol={i % 7 === 6}
              onQuickAdd={onQuickAdd}
            />
          );
        })}
      </div>

      {/* Ghost overlay while dragging */}
      <DragOverlay>
        {activePost && (
          <div className={`px-2 py-1 rounded text-xs font-medium truncate shadow-lg ring-2 ring-amber-400 max-w-[140px] ${statusColors[activePost.status] || 'bg-zinc-100 text-zinc-600'}`}>
            {activePost.caption || 'Untitled'}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
