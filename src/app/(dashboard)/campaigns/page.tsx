'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Plus,
  Megaphone,
} from 'lucide-react';

// Campaigns will be loaded from the API in a future release
// For now, show an empty state encouraging users to create their first campaign


export default function CampaignsPage() {
  const { activeWorkspace } = useWorkspaceStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Campaigns</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'Select workspace'} — group posts into tracked campaigns</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Create Your First Campaign</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
          Group your posts into campaigns to track performance, set goals, and measure engagement across platforms.
        </p>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* How campaigns work */}
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
    </div>
  );
}
