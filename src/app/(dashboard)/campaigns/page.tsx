'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useCampaigns, type CampaignStatus } from '@/hooks/use-campaigns';
import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge';
import { CampaignFormDialog } from '@/components/campaigns/campaign-form-dialog';
import {
  Plus,
  Megaphone,
  Loader2,
  Calendar,
  Target,
  LayoutList,
} from 'lucide-react';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
];

export default function CampaignsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: campaigns = [], isLoading } = useCampaigns(statusFilter);

  const postCount = (c: { posts?: { count: number }[] }) =>
    c.posts?.[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Campaigns</h1>
          <p className="text-sm text-zinc-500">
            {activeWorkspace?.name || 'Select workspace'} — group posts into tracked campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            {statusFilter === 'all' ? 'Create Your First Campaign' : `No ${statusFilter} campaigns`}
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
            Group your posts into campaigns to track performance, set goals, and measure engagement across platforms.
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      ) : (
        /* Campaign list */
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors">
                      {campaign.name}
                    </h3>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-zinc-500 line-clamp-1 mb-3">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    {campaign.goal && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> {campaign.goal}
                      </span>
                    )}
                    {(campaign.start_date || campaign.end_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {campaign.start_date && new Date(campaign.start_date).toLocaleDateString()}
                        {campaign.start_date && campaign.end_date && ' — '}
                        {campaign.end_date && new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <LayoutList className="w-3.5 h-3.5" />
                      {postCount(campaign)} post{postCount(campaign) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* How campaigns work (show below list if there are campaigns) */}
      {campaigns.length > 0 && (
        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">How campaigns work</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Create a campaign', desc: 'Set a name, date range, and UTM tag for tracking' },
              { step: '2', title: 'Add posts', desc: 'Assign posts to the campaign across any platform' },
              { step: '3', title: 'Track results', desc: 'Monitor impressions, engagement, and progress in one view' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-zinc-900 font-bold text-xs flex items-center justify-center shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CampaignFormDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
