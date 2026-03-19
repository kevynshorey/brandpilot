'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo analytics data
const OVERVIEW_STATS = [
  { label: 'Total Followers', value: '2,847', change: '+124', trend: 'up' as const, icon: Users },
  { label: 'Total Reach', value: '18.4K', change: '+2.1K', trend: 'up' as const, icon: Eye },
  { label: 'Engagement Rate', value: '4.2%', change: '+0.3%', trend: 'up' as const, icon: Heart },
  { label: 'Posts This Month', value: '12', change: '-3', trend: 'down' as const, icon: Share2 },
];

const PLATFORM_STATS = [
  { platform: 'Instagram', icon: Instagram, color: 'text-pink-500', followers: '1,923', engagement: '5.1%', reach: '12.3K', posts: 8 },
  { platform: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', followers: '924', engagement: '3.2%', reach: '6.1K', posts: 4 },
];

const TOP_POSTS = [
  { caption: 'Launch announcement post with product demo', likes: 342, comments: 28, shares: 15, platform: 'instagram', date: 'Mar 15' },
  { caption: 'Investment readiness tips for first-time founders', likes: 189, comments: 42, shares: 31, platform: 'linkedin', date: 'Mar 12' },
  { caption: 'Behind the scenes: how we built the scoring engine', likes: 156, comments: 19, shares: 8, platform: 'instagram', date: 'Mar 10' },
];

// Simple sparkline component
function Sparkline({ data, color = 'stroke-amber-500' }: { data: number[]; color?: string }) {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>
        <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'All workspaces'} — last 30 days</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-zinc-500" />
                </div>
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Platform Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Platform Performance</h2>
          <div className="space-y-4">
            {PLATFORM_STATS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.platform} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-lg">
                  <Icon className={cn('w-8 h-8', p.color)} />
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-zinc-400">Followers</p>
                      <p className="text-sm font-semibold text-zinc-900">{p.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Engagement</p>
                      <p className="text-sm font-semibold text-zinc-900">{p.engagement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Reach</p>
                      <p className="text-sm font-semibold text-zinc-900">{p.reach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Posts</p>
                      <p className="text-sm font-semibold text-zinc-900">{p.posts}</p>
                    </div>
                  </div>
                  <Sparkline data={[12, 15, 18, 14, 22, 19, 25]} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Growth</h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Follower Growth (30d)</p>
              <Sparkline data={[2700, 2720, 2735, 2750, 2760, 2780, 2800, 2810, 2830, 2847]} color="stroke-emerald-500" />
              <p className="text-lg font-bold text-zinc-900 mt-2">+124 <span className="text-xs text-emerald-500 font-medium">+4.6%</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Engagement Trend</p>
              <Sparkline data={[3.8, 3.9, 4.0, 3.7, 4.1, 4.3, 4.0, 4.2, 4.5, 4.2]} color="stroke-amber-500" />
              <p className="text-lg font-bold text-zinc-900 mt-2">4.2% <span className="text-xs text-emerald-500 font-medium">+0.3%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Top Performing Posts</h2>
        <div className="space-y-3">
          {TOP_POSTS.map((post, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors">
              <span className="text-lg font-bold text-zinc-300 w-6 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 truncate">{post.caption}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{post.date} · {post.platform}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
                <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
