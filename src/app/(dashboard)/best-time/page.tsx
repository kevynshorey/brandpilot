'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Clock,
  Loader2,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Pin,
  TrendingUp,
  Star,
  AlertTriangle,
  Lightbulb,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'text-zinc-600' },
  { id: 'pinterest', label: 'Pinterest', icon: Pin, color: 'text-red-500' },
  { id: 'tiktok', label: 'TikTok', icon: TrendingUp, color: 'text-zinc-800' },
  { id: 'facebook', label: 'Facebook', icon: Linkedin, color: 'text-blue-500' },
];

interface DaySchedule {
  day: string;
  times: string[];
  reason: string;
}

interface BestTimeResult {
  best_times: DaySchedule[];
  peak_window: { day: string; time: string; reason: string };
  avoid: string[];
  platform_tips: string[];
  frequency: string;
}

const DAY_COLORS: Record<string, string> = {
  Monday: 'bg-blue-50 border-blue-200',
  Tuesday: 'bg-violet-50 border-violet-200',
  Wednesday: 'bg-emerald-50 border-emerald-200',
  Thursday: 'bg-amber-50 border-amber-200',
  Friday: 'bg-rose-50 border-rose-200',
  Saturday: 'bg-cyan-50 border-cyan-200',
  Sunday: 'bg-zinc-50 border-zinc-200',
};

export default function BestTimePage() {
  const [platform, setPlatform] = useState('instagram');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BestTimeResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const resp = await fetch('/api/ai/best-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, industry: industry.trim(), timezone: tz }),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || 'Failed');
      setResult(await resp.json());
      toast.success('Schedule analyzed!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Best Time to Post</h1>
        <p className="text-zinc-500 mt-1">AI-powered posting schedule based on platform engagement data</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Platform</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all',
                    platform === p.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  )}
                >
                  <Icon className={cn('w-5 h-5', platform === p.id ? 'text-amber-500' : p.color)} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Industry (optional)</label>
          <input
            type="text"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder="e.g., SaaS, Fashion, Real Estate, Food & Beverage"
            maxLength={200}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Find Best Times'}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Peak Window */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-zinc-900">Peak Window</h3>
            </div>
            <p className="text-lg font-bold text-amber-700">{result.peak_window.day} at {result.peak_window.time}</p>
            <p className="text-sm text-amber-600 mt-1">{result.peak_window.reason}</p>
          </div>

          {/* Weekly Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {result.best_times.map(day => (
              <div key={day.day} className={cn('rounded-xl border p-4', DAY_COLORS[day.day] || 'bg-white border-zinc-200')}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <h4 className="font-medium text-zinc-900 text-sm">{day.day}</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {day.times.map(time => (
                    <span key={time} className="px-2.5 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-700">
                      <Clock className="w-3 h-3 inline mr-1 text-zinc-400" />
                      {time}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">{day.reason}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avoid */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="font-medium text-zinc-900 text-sm">Avoid</h3>
              </div>
              <ul className="space-y-2">
                {result.avoid.map((item, i) => (
                  <li key={i} className="text-xs text-zinc-600 flex gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="font-medium text-zinc-900 text-sm">Platform Tips</h3>
              </div>
              <ul className="space-y-2">
                {result.platform_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-zinc-600 flex gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">
                  <strong>Recommended frequency:</strong> {result.frequency}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Select a platform to find optimal posting times</p>
        </div>
      )}
    </div>
  );
}
