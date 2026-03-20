'use client';

import { useMemo } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePosts } from '@/hooks/use-posts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-200 text-zinc-600',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  publishing: 'bg-amber-100 text-amber-700',
  pending_approval: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
};

export default function CalendarPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: posts = [], isLoading } = usePosts();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Group posts by date (use scheduled_at for scheduled posts, created_at for others)
  const postsByDate = useMemo(() => {
    const map: Record<string, Array<{ id: string; caption: string; status: string; platforms: string[] }>> = {};
    for (const post of posts as Record<string, unknown>[]) {
      const scheduledAt = post.scheduled_at as string | null;
      const publishedAt = post.published_at as string | null;
      const createdAt = post.created_at as string;
      const dateStr = scheduledAt || publishedAt || createdAt;
      if (!dateStr) continue;

      const date = new Date(dateStr).toISOString().slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push({
        id: post.id as string,
        caption: post.caption as string,
        status: post.status as string,
        platforms: (post.target_platforms as string[]) || [],
      });
    }
    return map;
  }, [posts]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  // Build calendar grid
  const cells: Array<{ day: number | null; dateStr: string }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: '' });
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, dateStr });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: '' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content Calendar</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'All workspaces'}</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <h2 className="text-lg font-semibold text-zinc-900">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-100">
          {DAYS.map((day) => (
            <div key={day} className="px-3 py-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const isToday = cell.dateStr === todayStr;
              const dayPosts = cell.dateStr ? postsByDate[cell.dateStr] || [] : [];

              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] p-2 border-b border-r border-zinc-100 transition-colors',
                    cell.day ? 'hover:bg-zinc-50' : 'bg-zinc-50/50',
                    i % 7 === 6 && 'border-r-0',
                  )}
                >
                  {cell.day && (
                    <>
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1',
                        isToday ? 'bg-amber-500 text-white font-bold' : 'text-zinc-600'
                      )}>
                        {cell.day}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium truncate',
                              statusColors[post.status] || 'bg-zinc-100 text-zinc-600'
                            )}
                            title={post.caption}
                          >
                            {post.caption}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <p className="text-[10px] text-zinc-400 px-1">+{dayPosts.length - 3} more</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-zinc-200" /> Draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100" /> Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100" /> Failed
        </span>
      </div>
    </div>
  );
}
