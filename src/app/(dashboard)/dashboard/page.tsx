'use client';

import Link from 'next/link';
import {
  Calendar,
  PenSquare,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Instagram,
  Linkedin,
  BookOpen,
  Palette,
  Zap,
  Check,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBlogPosts } from '@/hooks/use-blog';
import { StatusBadge } from '../blog/_components/status-badge';

function StatCard({ label, value, change, icon: Icon }: {
  label: string;
  value: string;
  change?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
          {change && <p className="text-xs text-emerald-600 mt-1">{change}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function GettingStartedChecklist() {
  const { activeWorkspace } = useWorkspaceStore();

  const steps = [
    {
      label: 'Name your brand',
      done: !!activeWorkspace?.name,
      href: '/settings',
      icon: Palette,
    },
    {
      label: 'Set brand voice & industry',
      done: !!activeWorkspace?.industry,
      href: '/brand',
      icon: Zap,
    },
    {
      label: 'Connect a social account',
      done: false,
      href: '/settings',
      icon: Instagram,
    },
    {
      label: 'Create your first post',
      done: false,
      href: '/create',
      icon: PenSquare,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Getting Started</h3>
            <p className="text-xs text-zinc-400">{completedCount} of {steps.length} complete</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.label}
              href={step.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                step.done
                  ? 'bg-green-100 border-green-200'
                  : 'bg-white border-zinc-200 group-hover:border-amber-300'
              }`}>
                {step.done ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Icon className="w-2.5 h-2.5 text-zinc-400" />
                )}
              </div>
              <span className={`text-sm ${
                step.done ? 'text-zinc-400 line-through' : 'text-zinc-700 font-medium'
              }`}>
                {step.label}
              </span>
              {!step.done && (
                <ArrowRight className="w-3 h-3 text-zinc-300 ml-auto group-hover:text-amber-500 transition-colors" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RecentBlogsWidget() {
  const { data: blogPosts = [], isLoading } = useBlogPosts();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="h-4 w-28 bg-zinc-100 rounded animate-pulse mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="h-4 w-40 bg-zinc-100 rounded animate-pulse flex-1" />
            <div className="h-5 w-14 bg-zinc-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const recentPosts = (blogPosts as Record<string, unknown>[]).slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-zinc-900">Recent Blogs</h3>
        </div>
        <Link href="/blog" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recentPosts.length === 0 ? (
        <div className="text-center py-6">
          <BookOpen className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
          <p className="text-xs text-zinc-400 mb-2">No blog posts yet</p>
          <Link
            href="/blog"
            className="text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            Create your first blog
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {recentPosts.map((post) => (
            <Link
              key={post.id as string}
              href="/blog"
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 truncate font-medium">
                  {(post.title as string) || 'Untitled'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {post.published_at
                    ? new Date(post.published_at as string).toLocaleDateString()
                    : 'Draft'}
                </p>
              </div>
              <StatusBadge status={(post.status as string) || 'draft'} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const brandName = activeWorkspace?.name || 'Are You Vintage';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{brandName}</h1>
        <p className="text-zinc-500 mt-1">Overview of your social media performance</p>
      </div>

      {/* Getting Started */}
      <GettingStartedChecklist />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/create" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors group">
          <PenSquare className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-zinc-900">Create Post</span>
        </Link>
        <Link href="/blog" className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <BookOpen className="w-5 h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900">Write Blog</span>
        </Link>
        <Link href="/calendar" className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <Calendar className="w-5 h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900">Calendar</span>
        </Link>
        <Link href="/analytics" className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <BarChart3 className="w-5 h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900">Analytics</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Scheduled Posts" value="0" icon={Clock} />
        <StatCard label="Published This Week" value="0" icon={CheckCircle2} />
        <StatCard label="Total Followers" value="--" icon={TrendingUp} />
        <StatCard label="Engagement Rate" value="--" icon={BarChart3} />
      </div>

      {/* Three columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Posts */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900">Upcoming Posts</h3>
            <Link href="/calendar" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-8 h-8 text-zinc-200 mb-2" />
            <p className="text-xs text-zinc-400 mb-2">No posts scheduled</p>
            <Link href="/create" className="text-xs font-medium text-amber-600 hover:text-amber-700">
              Create a post
            </Link>
          </div>
        </div>

        {/* Recent Blogs */}
        <RecentBlogsWidget />

        {/* Connected Accounts */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Platforms</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50">
              <Instagram className="w-4 h-4 text-pink-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">Instagram</p>
                <p className="text-xs text-zinc-400">Not connected</p>
              </div>
              <AlertCircle className="w-3.5 h-3.5 text-zinc-300" />
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50">
              <Linkedin className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">LinkedIn</p>
                <p className="text-xs text-zinc-400">Not connected</p>
              </div>
              <AlertCircle className="w-3.5 h-3.5 text-zinc-300" />
            </div>
          </div>
          <Link href="/settings" className="block text-center mt-3 text-xs text-amber-600 hover:text-amber-700">
            Connect accounts
          </Link>
        </div>
      </div>
    </div>
  );
}
