'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Zap,
  ExternalLink,
  Plus,
} from 'lucide-react';

export default function AutomationsPage() {
  const { activeWorkspace } = useWorkspaceStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Automations</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'Select workspace'} — Make.com scenarios</p>
        </div>
        <a
          href="https://make.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Open Make.com <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Connect Make.com</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
          Automate your content pipeline with Make.com scenarios. Generate AI content, schedule posts,
          and publish across platforms — all on autopilot.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://make.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Set Up Automation
          </a>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">How automations work</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Create a scenario', desc: 'Build a Make.com scenario that calls BrandPilot\'s webhook API' },
            { step: '2', title: 'Configure triggers', desc: 'Set up schedules, webhooks, or manual triggers for content generation' },
            { step: '3', title: 'Auto-publish', desc: 'Generated content flows through approval and publishes to your platforms' },
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
