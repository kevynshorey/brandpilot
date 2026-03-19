'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/utils';
import {
  Plus,
  Megaphone,
  Calendar,
  Target,
  BarChart3,
  MoreVertical,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
} from 'lucide-react';

type CampaignStatus = 'all' | 'draft' | 'active' | 'completed';

const DEMO_CAMPAIGNS = [
  {
    id: '1',
    name: 'Launch Week',
    description: 'Product launch announcement across all platforms',
    status: 'active' as const,
    startDate: '2026-03-18',
    endDate: '2026-03-25',
    posts: 8,
    published: 3,
    impressions: '12.4K',
    engagement: '4.8%',
    utm: 'launch-week',
  },
  {
    id: '2',
    name: 'Q1 Brand Awareness',
    description: 'Ongoing brand storytelling and educational content',
    status: 'active' as const,
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    posts: 24,
    published: 18,
    impressions: '45.2K',
    engagement: '3.9%',
    utm: 'q1-awareness',
  },
  {
    id: '3',
    name: 'Holiday Rental Push',
    description: 'Promote vacation rental listings for Easter season',
    status: 'draft' as const,
    startDate: '2026-03-25',
    endDate: '2026-04-15',
    posts: 12,
    published: 0,
    impressions: '--',
    engagement: '--',
    utm: 'easter-rentals',
  },
  {
    id: '4',
    name: 'January New Year',
    description: 'New year fresh start messaging',
    status: 'completed' as const,
    startDate: '2026-01-01',
    endDate: '2026-01-15',
    posts: 6,
    published: 6,
    impressions: '8.7K',
    engagement: '5.2%',
    utm: 'new-year-2026',
  },
];

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-600', icon: Clock },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', icon: Pause },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
};

export default function CampaignsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [filter, setFilter] = useState<CampaignStatus>('all');

  const filtered = DEMO_CAMPAIGNS.filter((c) => filter === 'all' || c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Campaigns</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name} — group posts into tracked campaigns</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1 w-fit">
        {(['all', 'draft', 'active', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              filter === s ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((campaign) => {
          const config = statusConfig[campaign.status];
          const StatusIcon = config.icon;
          const progress = campaign.posts > 0 ? Math.round((campaign.published / campaign.posts) * 100) : 0;

          return (
            <div key={campaign.id} className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{campaign.name}</h3>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1', config.color)}>
                      <StatusIcon className="w-3 h-3" /> {config.label}
                    </span>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-zinc-100"><MoreVertical className="w-4 h-4 text-zinc-400" /></button>
              </div>

              <p className="text-xs text-zinc-500 mb-4">{campaign.description}</p>

              {/* Date range */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                <Calendar className="w-3 h-3" />
                {new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">{campaign.published}/{campaign.posts} posts published</span>
                  <span className="text-zinc-500">{progress}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-100">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">Impressions</p>
                  <p className="text-sm font-semibold text-zinc-900">{campaign.impressions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">Engagement</p>
                  <p className="text-sm font-semibold text-zinc-900">{campaign.engagement}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">UTM</p>
                  <p className="text-sm font-mono text-amber-600 truncate">{campaign.utm}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
