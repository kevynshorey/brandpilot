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
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';

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

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const brandName = activeWorkspace?.name || 'Are You Vintage';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{brandName}</h1>
        <p className="text-zinc-500 mt-1">Overview of your social media performance</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/create" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors group">
          <PenSquare className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-zinc-900">Create Post</span>
        </Link>
        <Link href="/calendar" className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <Calendar className="w-5 h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900">Calendar</span>
        </Link>
        <Link href="/analytics" className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <BarChart3 className="w-5 h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900">Analytics</span>
        </Link>
        <Link href="/automations" className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <TrendingUp className="w-5 h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900">Automations</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Scheduled Posts" value="0" icon={Clock} />
        <StatCard label="Published This Week" value="0" icon={CheckCircle2} />
        <StatCard label="Total Followers" value="--" icon={TrendingUp} />
        <StatCard label="Engagement Rate" value="--" icon={BarChart3} />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Posts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Upcoming Posts</h2>
            <Link href="/calendar" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View Calendar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-zinc-300 mb-3" />
            <p className="text-sm text-zinc-500 mb-4">No posts scheduled yet</p>
            <Link href="/create" className="text-sm font-medium text-amber-600 hover:text-amber-700">
              Create your first post
            </Link>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Platforms</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
              <Instagram className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">Instagram</p>
                <p className="text-xs text-zinc-400">Not connected</p>
              </div>
              <AlertCircle className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">LinkedIn</p>
                <p className="text-xs text-zinc-400">Not connected</p>
              </div>
              <AlertCircle className="w-4 h-4 text-zinc-300" />
            </div>
          </div>
          <Link href="/settings" className="block text-center mt-4 text-sm text-amber-600 hover:text-amber-700">
            Connect accounts
          </Link>
        </div>
      </div>
    </div>
  );
}
