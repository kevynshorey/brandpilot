'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Instagram,
  Linkedin,
  Twitter,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'workspace' | 'accounts' | 'team' | 'billing';

const TABS = [
  { id: 'workspace' as const, label: 'Workspace', icon: Building2 },
  { id: 'accounts' as const, label: 'Social Accounts', icon: Globe },
  { id: 'team' as const, label: 'Team', icon: User },
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', category: 'social' },
  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-600', category: 'social' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', category: 'social' },
  { id: 'twitter', label: 'X', icon: Twitter, color: 'text-zinc-600', category: 'social' },
  { id: 'threads', label: 'Threads', icon: Instagram, color: 'text-zinc-800', category: 'social' },
  { id: 'pinterest', label: 'Pinterest', icon: Globe, color: 'text-red-600', category: 'social' },
  { id: 'tiktok', label: 'TikTok', icon: Globe, color: 'text-zinc-900', category: 'social' },
];

const AD_PLATFORMS = [
  { id: 'facebook_ads', label: 'Facebook Ads', icon: Globe, color: 'text-blue-500', category: 'ads' },
  { id: 'google_ads', label: 'Google Ads', icon: Globe, color: 'text-green-600', category: 'ads' },
  { id: 'google_analytics', label: 'Google Analytics', icon: Globe, color: 'text-orange-500', category: 'analytics' },
];

export default function SettingsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [tab, setTab] = useState<SettingsTab>('workspace');
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [industry, setIndustry] = useState(activeWorkspace?.industry || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                tab === t.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Workspace Settings */}
      {tab === 'workspace' && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Workspace Name</label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Real Estate, Fashion, SaaS"
              className="w-full max-w-md px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Brand Color</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-zinc-200" style={{ backgroundColor: activeWorkspace?.brand_color_primary || '#000' }} />
              <input
                type="text"
                defaultValue={activeWorkspace?.brand_color_primary || '#000000'}
                className="w-32 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Timezone</label>
            <select className="w-full max-w-md px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30">
              <option>America/Barbados (AST)</option>
              <option>America/New_York (EST)</option>
              <option>Europe/London (GMT)</option>
            </select>
          </div>
          <button onClick={handleSave} className="px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors">
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Social Accounts */}
      {tab === 'accounts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">Social Platforms</h2>
            <p className="text-sm text-zinc-500 mb-4">Connect accounts to publish posts directly.</p>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isConnected = false;
                return (
                  <div key={platform.id} className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
                    <Icon className={cn('w-6 h-6', platform.color)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">{platform.label}</p>
                      <p className="text-xs text-zinc-400">{isConnected ? 'Connected' : 'Not connected'}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                      {isConnected ? 'Manage' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">Advertising & Analytics</h2>
            <p className="text-sm text-zinc-500 mb-4">Connect ad platforms and analytics for campaign tracking.</p>
            <div className="space-y-2">
              {AD_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isConnected = false;
                return (
                  <div key={platform.id} className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
                    <Icon className={cn('w-6 h-6', platform.color)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">{platform.label}</p>
                      <p className="text-xs text-zinc-400">{isConnected ? 'Connected' : 'Not connected'}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded mr-2">{platform.category === 'ads' ? 'Ads' : 'Analytics'}</span>
                    <button className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                      {isConnected ? 'Manage' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      {tab === 'team' && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Team Members</h2>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors">
              <Plus className="w-4 h-4" /> Invite
            </button>
          </div>
          <div className="p-4 bg-zinc-50 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">KS</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">Kevyn Shorey</p>
              <p className="text-xs text-zinc-400">kevynshorey@gmail.com</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Owner</span>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'billing' && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Current Plan</h2>
          <div className="p-4 bg-zinc-50 rounded-lg mb-4">
            <p className="text-2xl font-bold text-zinc-900">Free</p>
            <p className="text-sm text-zinc-500 mt-1">2 workspaces, 50 posts/month, basic analytics</p>
          </div>
          <button className="px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors">
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
