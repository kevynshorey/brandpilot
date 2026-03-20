'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUpdateWorkspace } from '@/hooks/use-workspaces';
import { useSocialAccounts, useConnectSocialAccount, useDisconnectSocialAccount } from '@/hooks/use-social-accounts';
import { useBillingUsage, useCheckout, useCustomerPortal } from '@/hooks/use-billing';
import { useOrganization } from '@/hooks/use-user';
import { PLANS, PLAN_ORDER, getPlanById, isUpgrade, type PlanId } from '@/lib/billing-plans';
import { toast } from 'sonner';
import {
  User,
  Building2,
  CreditCard,
  Instagram,
  Linkedin,
  Twitter,
  Plus,
  CheckCircle2,
  Trash2,
  Globe,
  Loader2,
  Pin,
  Zap,
  Crown,
  ArrowUpRight,
  Check,
  Sparkles,
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
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', desc: 'Connect via Facebook Business' },
  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-600', desc: 'Facebook Page publishing' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', desc: 'Personal or Company page' },
  { id: 'twitter', label: 'X', icon: Twitter, color: 'text-zinc-600', desc: 'Post tweets and threads' },
  { id: 'pinterest', label: 'Pinterest', icon: Pin, color: 'text-red-600', desc: 'Pin images to boards' },
  { id: 'tiktok', label: 'TikTok', icon: Globe, color: 'text-zinc-900', desc: 'Video and photo posts' },
];

const AD_PLATFORMS = [
  { id: 'facebook_ads', label: 'Facebook Ads', icon: Globe, color: 'text-blue-500', badge: 'Ads' },
  { id: 'google_ads', label: 'Google Ads', icon: Globe, color: 'text-green-600', badge: 'Ads' },
  { id: 'google_analytics', label: 'Google Analytics', icon: Globe, color: 'text-orange-500', badge: 'Analytics' },
];

export default function SettingsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: accounts = [], isLoading: accountsLoading } = useSocialAccounts();
  const connectAccount = useConnectSocialAccount();
  const disconnectAccount = useDisconnectSocialAccount();
  const updateWorkspace = useUpdateWorkspace();
  const { setActiveWorkspace } = useWorkspaceStore();
  const [tab, setTab] = useState<SettingsTab>('workspace');
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [industry, setIndustry] = useState(activeWorkspace?.industry || '');
  const [brandColor, setBrandColor] = useState(activeWorkspace?.brand_color_primary || '#000000');

  // Sync state when workspace changes
  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
      setIndustry(activeWorkspace.industry || '');
      setBrandColor(activeWorkspace.brand_color_primary || '#000000');
    }
  }, [activeWorkspace]);

  // Manual connect modal state
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectName, setConnectName] = useState('');

  const handleSave = async () => {
    if (!activeWorkspace?.id) return;
    try {
      const updated = await updateWorkspace.mutateAsync({
        id: activeWorkspace.id,
        name: workspaceName.trim(),
        industry: industry.trim() || null,
        brand_color_primary: brandColor,
      });
      setActiveWorkspace(updated);
      toast.success('Workspace settings saved!');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleConnect = async (platformId: string) => {
    // For MVP: manual account name entry (real OAuth comes later)
    setConnectingPlatform(platformId);
    setConnectName('');
  };

  const handleConfirmConnect = async () => {
    if (!connectingPlatform || !connectName.trim() || !activeWorkspace?.id) return;
    try {
      await connectAccount.mutateAsync({
        workspace_id: activeWorkspace.id,
        platform: connectingPlatform,
        account_name: connectName.trim(),
        platform_account_id: connectName.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
      });
      toast.success(`${connectingPlatform} account connected!`);
      setConnectingPlatform(null);
    } catch {
      toast.error('Failed to connect account');
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    try {
      await disconnectAccount.mutateAsync(accountId);
      toast.success(`${platform} disconnected`);
    } catch {
      toast.error('Failed to disconnect');
    }
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
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-32 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
              <div className="flex-1 h-10 rounded-lg border border-zinc-200" style={{ backgroundColor: brandColor }} />
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
          <button
            onClick={handleSave}
            disabled={updateWorkspace.isPending || !workspaceName.trim()}
            className="px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {updateWorkspace.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {updateWorkspace.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Social Accounts */}
      {tab === 'accounts' && (
        <div className="space-y-6">
          {/* Connect modal */}
          {connectingPlatform && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                  Connect {SOCIAL_PLATFORMS.find(p => p.id === connectingPlatform)?.label}
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Enter your account username or page name. Full OAuth integration coming soon.
                </p>
                <input
                  value={connectName}
                  onChange={e => setConnectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmConnect()}
                  placeholder="@username or page name"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 mb-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setConnectingPlatform(null)}
                    className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmConnect}
                    disabled={!connectName.trim() || connectAccount.isPending}
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connectAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Make.com Integration Banner */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-5 flex items-start gap-4">
            <Zap className="w-6 h-6 text-violet-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-violet-900">Make.com Integration</h3>
              <p className="text-xs text-violet-700 mt-1">
                BrandPilot uses Make.com to publish posts to your connected accounts. Set up a Make.com scenario
                that listens for our webhook and publishes to your social platforms.
              </p>
              <p className="text-xs text-violet-600 mt-2 font-mono">
                Webhook URL: <code className="bg-violet-100 px-1 rounded">/api/make/webhook</code>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">Social Platforms</h2>
            <p className="text-sm text-zinc-500 mb-4">Connect accounts to publish posts directly.</p>
            {accountsLoading ? (
              <div className="flex items-center gap-2 p-4 text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts...
              </div>
            ) : (
              <div className="space-y-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const account = accounts.find(a => a.platform === platform.id);
                  const isConnected = !!account;

                  return (
                    <div key={platform.id} className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
                      <Icon className={cn('w-6 h-6', platform.color)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900">{platform.label}</p>
                        {isConnected ? (
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected as {account.account_name}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400">{platform.desc}</p>
                        )}
                      </div>
                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnect(account.id, platform.label)}
                          disabled={disconnectAccount.isPending}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          className="px-3 py-1.5 bg-amber-500 text-zinc-900 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">Advertising & Analytics</h2>
            <p className="text-sm text-zinc-500 mb-4">Connect ad platforms and analytics for campaign tracking.</p>
            <div className="space-y-2">
              {AD_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.id} className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
                    <Icon className={cn('w-6 h-6', platform.color)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">{platform.label}</p>
                      <p className="text-xs text-zinc-400">Not connected</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded mr-2">{platform.badge}</span>
                    <button className="px-3 py-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-xs font-medium cursor-not-allowed">
                      Coming soon
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
      {tab === 'billing' && <BillingTab />}
    </div>
  );
}

// --- Usage meter bar ---
function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isHigh = pct >= 80;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-700">{label}</span>
        <span className={cn('font-medium', isHigh ? 'text-red-600' : 'text-zinc-500')}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isHigh ? 'bg-red-500' : 'bg-amber-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// --- Billing Tab ---
function BillingTab() {
  const { data: org } = useOrganization();
  const orgRecord = org as Record<string, unknown> | null;
  const { data: usageData, isLoading } = useBillingUsage();
  const checkout = useCheckout();
  const portal = useCustomerPortal();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlanId = ((orgRecord?.plan as string) || usageData?.plan || 'free') as PlanId;
  const currentPlan = getPlanById(currentPlanId);
  const hasSubscription = !!orgRecord?.stripe_subscription_id;

  const handleUpgrade = async (planId: PlanId) => {
    try {
      const { url } = await checkout.mutateAsync({ planId, billing: billingCycle });
      if (url) window.location.href = url;
    } catch {
      toast.error('Failed to start checkout');
    }
  };

  const handleManage = async () => {
    try {
      const { url } = await portal.mutateAsync();
      if (url) window.location.href = url;
    } catch {
      toast.error('No billing account found. Subscribe to a plan first.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan + Usage */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-zinc-900">Current Plan</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-zinc-900">{currentPlan.name}</span>
              {currentPlanId !== 'free' && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">{currentPlan.description}</p>
          </div>
          {hasSubscription && (
            <button
              onClick={handleManage}
              disabled={portal.isPending}
              className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg text-sm hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
            >
              {portal.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              Manage Subscription
            </button>
          )}
        </div>

        {/* Usage meters */}
        {usageData && (
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <p className="text-sm font-medium text-zinc-700">This month&apos;s usage</p>
            <UsageMeter
              label="AI Posts"
              used={usageData.usage.postsThisMonth.used}
              limit={currentPlan.limits.maxPostsPerMonth}
            />
            <UsageMeter
              label="Blog Posts"
              used={usageData.usage.blogPostsThisMonth.used}
              limit={currentPlan.limits.maxBlogPostsPerMonth}
            />
            <UsageMeter
              label="Social Accounts"
              used={usageData.usage.socialAccounts.used}
              limit={currentPlan.limits.maxSocialAccounts}
            />
            <UsageMeter
              label="Workspaces"
              used={usageData.usage.workspaces.used}
              limit={currentPlan.limits.maxWorkspaces}
            />
          </div>
        )}
      </div>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            billingCycle === 'monthly' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
            billingCycle === 'yearly' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          Yearly
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
            Save 20%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlanId;
          const canUpgrade = isUpgrade(currentPlanId, planId);
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;

          return (
            <div
              key={planId}
              className={cn(
                'rounded-xl border p-5 flex flex-col',
                plan.popular ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-200' : 'border-zinc-200 bg-white',
                isCurrent && 'ring-2 ring-amber-400'
              )}
            >
              {plan.popular && (
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">Most Popular</span>
                </div>
              )}

              <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
              <p className="text-xs text-zinc-500 mt-0.5 mb-4">{plan.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-zinc-900">
                  ${price}
                </span>
                {price > 0 && <span className="text-sm text-zinc-400">/mo</span>}
              </div>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 border border-zinc-300 text-zinc-500 rounded-lg text-sm font-medium mb-4"
                >
                  Current Plan
                </button>
              ) : canUpgrade ? (
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={checkout.isPending}
                  className="w-full px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors mb-4 flex items-center justify-center gap-1.5"
                >
                  {checkout.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Upgrade
                </button>
              ) : (
                <button
                  onClick={handleManage}
                  className="w-full px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 mb-4"
                >
                  Downgrade
                </button>
              )}

              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-zinc-600">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FAQ / Help */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">Billing FAQ</h3>
        <div className="space-y-2 text-xs text-zinc-500">
          <p><strong className="text-zinc-700">Can I cancel anytime?</strong> — Yes, cancel from the Manage Subscription portal. Your plan stays active until the end of the billing period.</p>
          <p><strong className="text-zinc-700">What happens if I exceed my limits?</strong> — You&apos;ll be notified and can upgrade. Existing scheduled posts will still publish.</p>
          <p><strong className="text-zinc-700">Do you offer refunds?</strong> — We offer prorated refunds within the first 14 days of any plan change.</p>
        </div>
      </div>
    </div>
  );
}
