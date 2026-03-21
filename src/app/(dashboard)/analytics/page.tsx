'use client';

import { useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePostStats, useTopPosts, useAccountSnapshots } from '@/hooks/use-analytics';
import { useSocialAccounts } from '@/hooks/use-social-accounts';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Instagram,
  Linkedin,
  Twitter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Pin,
  Zap,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  pinterest: Pin,
};

const platformColors: Record<string, string> = {
  instagram: 'text-pink-500',
  linkedin: 'text-blue-600',
  twitter: 'text-zinc-600',
  pinterest: 'text-red-500',
  facebook: 'text-blue-500',
  tiktok: 'text-zinc-800',
};

// Simple sparkline SVG
function Sparkline({ data, color = 'stroke-amber-500' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={color} points={points} />
    </svg>
  );
}

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: stats, isLoading: statsLoading } = usePostStats();
  const { data: topPosts = [], isLoading: postsLoading } = useTopPosts(5);
  const { data: accounts = [] } = useSocialAccounts();
  const { data: accountSnapshots = [] } = useAccountSnapshots();

  const monthChange = useMemo(() => {
    if (!stats) return { value: 0, label: '0' };
    const diff = stats.publishedThisMonth - stats.publishedLastMonth;
    return { value: diff, label: diff >= 0 ? `+${diff}` : `${diff}` };
  }, [stats]);

  // Build platform breakdown from real stats
  const platformBreakdown = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byPlatform)
      .sort(([, a], [, b]) => b - a)
      .map(([platform, count]) => {
        const snapshot = accountSnapshots.find((a: Record<string, unknown>) => a.platform === platform);
        const latestSnapshot = snapshot?.snapshots?.[0];
        return {
          platform,
          postCount: count,
          followers: latestSnapshot?.followers || null,
          reach: latestSnapshot?.reach || null,
          engagement: latestSnapshot?.engagement_rate || null,
          sparkData: snapshot?.snapshots?.slice(0, 10).reverse().map((s: Record<string, unknown>) => (s.followers as number) || 0) || [],
        };
      });
  }, [stats, accountSnapshots]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
      </div>
    );
  }

  const hasConnectedAccounts = accounts.length > 0;

  const exportCSV = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Posts', String(stats.total)],
      ['Published', String(stats.published)],
      ['Scheduled', String(stats.scheduled)],
      ['Failed', String(stats.failed)],
      ['Published This Month', String(stats.publishedThisMonth)],
      ['Published Last Month', String(stats.publishedLastMonth)],
      [''],
      ['Platform', 'Posts'],
      ...Object.entries(stats.byPlatform).map(([p, c]) => [p, String(c)]),
      [''],
      ['Content Type', 'Posts'],
      ...Object.entries(stats.byContentType).map(([t, c]) => [t, String(c)]),
    ];
    if (topPosts.length > 0) {
      rows.push([''], ['Top Posts'], ['Caption', 'Platform', 'Status', 'Date']);
      for (const post of topPosts as unknown as Record<string, unknown>[]) {
        rows.push([
          String((post.caption as string)?.slice(0, 100) || ''),
          String((post.target_platforms as string[])?.join(', ') || ''),
          String(post.status || ''),
          String(post.published_at || post.scheduled_at || post.created_at || ''),
        ]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${activeWorkspace?.slug || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'All workspaces'} — content performance</p>
        </div>
        {stats && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Overview Stats (from real post data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-zinc-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.total || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Posts</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              monthChange.value >= 0 ? 'text-emerald-600' : 'text-red-500'
            )}>
              {monthChange.value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {monthChange.label} vs last month
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.published || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Published</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.scheduled || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Scheduled</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats?.failed || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Failed</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Platform Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Posts by Platform</h2>
          {platformBreakdown.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No posts yet — create your first post to see platform stats</p>
            </div>
          ) : (
            <div className="space-y-3">
              {platformBreakdown.map((p) => {
                const Icon = platformIcons[p.platform] || FileText;
                const color = platformColors[p.platform] || 'text-zinc-500';
                return (
                  <div key={p.platform} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-lg">
                    <Icon className={cn('w-7 h-7', color)} />
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-zinc-400">Posts</p>
                        <p className="text-sm font-semibold text-zinc-900">{p.postCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Followers</p>
                        <p className="text-sm font-semibold text-zinc-900">
                          {p.followers !== null ? p.followers.toLocaleString() : <span className="text-zinc-300">—</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Reach</p>
                        <p className="text-sm font-semibold text-zinc-900">
                          {p.reach !== null ? p.reach.toLocaleString() : <span className="text-zinc-300">—</span>}
                        </p>
                      </div>
                    </div>
                    {p.sparkData.length >= 2 && <Sparkline data={p.sparkData} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Mix */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Content Mix</h2>
          {stats && stats.total > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byContentType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-700 capitalize">{type.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}

              <div className="pt-4 border-t border-zinc-100 mt-4">
                <p className="text-xs text-zinc-400 mb-1">This Month</p>
                <p className="text-lg font-bold text-zinc-900">
                  {stats.publishedThisMonth} <span className="text-sm font-normal text-zinc-400">published</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Create posts to see your content mix</p>
            </div>
          )}
        </div>
      </div>

      {/* Social Engagement (requires connected accounts) */}
      {!hasConnectedAccounts && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 flex items-start gap-4">
          <Zap className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Connect social accounts for engagement metrics</h3>
            <p className="text-xs text-amber-700 mt-1">
              Follower counts, reach, engagement rates, and per-post metrics will appear here once you connect your social accounts in Settings.
            </p>
            <Link href="/settings" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-amber-700 hover:text-amber-900">
              Go to Settings <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Top Posts */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Published Posts</h2>
        {postsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />
          </div>
        ) : topPosts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No published posts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPosts.map((post, i) => {
              const totalEngagement = post.post_analytics.reduce((sum, pa) => sum + pa.likes + pa.comments + pa.shares, 0);
              const platforms = post.target_platforms || [];
              return (
                <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                  <span className="text-lg font-bold text-zinc-300 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 truncate">{post.caption}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        {platforms.map(p => {
                          const Icon = platformIcons[p];
                          return Icon ? <Icon key={p} className="w-3 h-3 text-zinc-400" /> : null;
                        })}
                      </div>
                      <span className="text-xs text-zinc-400">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'No date'}
                      </span>
                    </div>
                  </div>
                  {post.post_analytics.length > 0 ? (
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.post_analytics.reduce((s, pa) => s + pa.likes, 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.post_analytics.reduce((s, pa) => s + pa.comments, 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {post.post_analytics.reduce((s, pa) => s + pa.shares, 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-300">No metrics yet</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
