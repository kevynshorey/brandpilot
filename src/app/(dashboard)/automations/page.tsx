'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/utils';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

// Demo Make.com scenarios mapped to workspaces
const SCENARIOS: Record<string, Array<{
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  schedule: string;
  lastRun: string | null;
  lastRunStatus: 'success' | 'error' | null;
  executions: number;
}>> = {
  'are-you-vintage': [
    { id: 4223387, name: 'Content Scheduler', description: 'AI content generation with Nano Banana images, blog writing, quality scoring', status: 'active', schedule: 'On-demand', lastRun: '2026-03-05', lastRunStatus: 'success', executions: 44 },
    { id: 4185190, name: 'Instagram Post Approval', description: 'Email approval flow, publishes to Instagram on approval', status: 'active', schedule: 'Webhook', lastRun: null, lastRunStatus: null, executions: 0 },
    { id: 4185195, name: 'Pinterest Auto-Post', description: 'Auto-post to Pinterest from approved content', status: 'active', schedule: 'Webhook', lastRun: '2026-03-05', lastRunStatus: 'error', executions: 2 },
    { id: 4185213, name: 'Creative Generator', description: 'Generate captions and hashtags from topic + brand voice', status: 'active', schedule: 'Webhook', lastRun: null, lastRunStatus: null, executions: 0 },
  ],
  'island-chem': [
    { id: 4232031, name: 'Content Scheduler', description: 'Product content generation with Nano Banana images, 3-day cycle', status: 'active', schedule: 'Every 3 days', lastRun: '2026-03-15', lastRunStatus: 'success', executions: 16 },
    { id: 4169656, name: 'Instagram Post Approval', description: 'Email approval + publish to Instagram', status: 'active', schedule: 'Webhook', lastRun: '2026-03-15', lastRunStatus: 'success', executions: 58 },
  ],
  'prime-barbados': [
    { id: 4240417, name: 'Content Scheduler', description: 'Real estate content with Nano Banana images, 2-day cycle', status: 'active', schedule: 'Every 2 days', lastRun: '2026-03-17', lastRunStatus: 'success', executions: 35 },
    { id: 4170636, name: 'Instagram Post Approval', description: 'Carousel + single post approval flow', status: 'active', schedule: 'Webhook', lastRun: '2026-03-17', lastRunStatus: 'success', executions: 100 },
    { id: 4245516, name: 'Email Nurture Sequence', description: 'Automated drip emails for leads via HubSpot', status: 'active', schedule: 'Every 12min', lastRun: '2026-03-18', lastRunStatus: 'success', executions: 1503 },
    { id: 4243602, name: 'Facebook Lead Ads', description: 'Capture leads from Facebook ads into HubSpot', status: 'active', schedule: 'Webhook', lastRun: null, lastRunStatus: null, executions: 0 },
  ],
  'launchpath': [
    { id: 4437768, name: 'Content Scheduler', description: 'Startup content with Nano Banana images, 3-day cycle', status: 'active', schedule: 'Every 3 days', lastRun: null, lastRunStatus: null, executions: 0 },
  ],
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  inactive: { label: 'Inactive', color: 'bg-zinc-100 text-zinc-500', icon: Pause },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function AutomationsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const slug = activeWorkspace?.slug || 'are-you-vintage';
  const scenarios = SCENARIOS[slug] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Automations</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'Select workspace'} — Make.com scenarios</p>
        </div>
        <a
          href="https://us2.make.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Open Make.com <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Scenario List */}
      <div className="space-y-3">
        {scenarios.map((scenario) => {
          const config = statusConfig[scenario.status];
          const StatusIcon = config.icon;
          return (
            <div key={scenario.id} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-900">{scenario.name}</h3>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', config.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{scenario.description}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scenario.schedule}
                    </span>
                    {scenario.lastRun && (
                      <span>Last run: {scenario.lastRun}</span>
                    )}
                    <span>{scenario.executions} executions</span>
                    {scenario.lastRunStatus === 'error' && (
                      <span className="text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Last run failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors" title="Run now">
                    <Play className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors" title="Refresh status">
                    <RefreshCw className="w-4 h-4 text-zinc-500" />
                  </button>
                  <a
                    href={`https://us2.make.com/organization/4310193/scenarios/${scenario.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                    title="Open in Make.com"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <Zap className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No automations configured for this workspace</p>
        </div>
      )}

      {/* Integration Note */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
        <p className="text-sm text-zinc-600">
          <strong>Image Generation:</strong> All content schedulers now use <span className="text-amber-600 font-medium">Nano Banana</span> (Google Gemini) for AI image generation.
          Images are uploaded to imgBB for hosting and stored in the shared data store.
        </p>
      </div>
    </div>
  );
}
