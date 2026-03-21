'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  Loader2,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Pin,
  TrendingUp,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'X', icon: Twitter },
  { id: 'pinterest', label: 'Pinterest', icon: Pin },
  { id: 'tiktok', label: 'TikTok', icon: TrendingUp },
];

interface ScoreBreakdown {
  score: number;
  feedback: string;
}

interface ScoreResult {
  overall_score: number;
  breakdown: {
    hook_strength: ScoreBreakdown;
    clarity: ScoreBreakdown;
    engagement_potential: ScoreBreakdown;
    cta_effectiveness: ScoreBreakdown;
    platform_fit: ScoreBreakdown;
    hashtag_quality: ScoreBreakdown;
  };
  improvements: string[];
  rewritten_version: string;
  predicted_performance: string;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-400';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className={cn(color, 'transition-all duration-1000')}
        />
      </svg>
      <span className="absolute text-2xl font-bold text-zinc-900">{score}</span>
    </div>
  );
}

function MetricBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        <span className={cn('text-sm font-bold', score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500')}>
          {score}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-zinc-500">{feedback}</p>
    </div>
  );
}

export default function ScorePage() {
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScore = async () => {
    if (!caption.trim()) { toast.error('Enter a caption first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const tagArray = hashtags.split(/[,\s]+/).filter(t => t.startsWith('#') || t.length > 1).map(t => t.startsWith('#') ? t : `#${t}`);
      const resp = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: caption.trim(), platform, hashtags: tagArray.length > 0 ? tagArray : undefined }),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || 'Scoring failed');
      setResult(await resp.json());
      toast.success('Content scored!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const useRewritten = () => {
    if (result?.rewritten_version) {
      setCaption(result.rewritten_version);
      setResult(null);
      toast.success('Loaded improved version — score again to check!');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Content Score</h1>
        <p className="text-zinc-500 mt-1">AI-powered analysis of your post before you publish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Paste your post caption here..."
              rows={6}
              maxLength={2000}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-zinc-400 mt-1">{caption.length}/2000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Platform</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      platform === p.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-zinc-200 text-zinc-500'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Hashtags (optional)</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#marketing #growth #tips"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleScore}
            disabled={loading || !caption.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Scoring...' : 'Score My Content'}
          </button>
        </div>

        {/* Results */}
        {result ? (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center">
              <ScoreRing score={result.overall_score} />
              <p className="text-sm font-medium text-zinc-700 mt-2">Overall Score</p>
              <p className={cn(
                'text-xs font-medium mt-1 px-3 py-1 rounded-full inline-block',
                result.predicted_performance.toLowerCase().includes('high') ? 'bg-emerald-50 text-emerald-700' :
                result.predicted_performance.toLowerCase().includes('medium') ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-600'
              )}>
                Predicted: {result.predicted_performance}
              </p>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
              <h3 className="font-semibold text-zinc-900 text-sm">Breakdown</h3>
              <MetricBar label="Hook Strength" score={result.breakdown.hook_strength.score} feedback={result.breakdown.hook_strength.feedback} />
              <MetricBar label="Clarity" score={result.breakdown.clarity.score} feedback={result.breakdown.clarity.feedback} />
              <MetricBar label="Engagement Potential" score={result.breakdown.engagement_potential.score} feedback={result.breakdown.engagement_potential.feedback} />
              <MetricBar label="CTA Effectiveness" score={result.breakdown.cta_effectiveness.score} feedback={result.breakdown.cta_effectiveness.feedback} />
              <MetricBar label="Platform Fit" score={result.breakdown.platform_fit.score} feedback={result.breakdown.platform_fit.feedback} />
              <MetricBar label="Hashtag Quality" score={result.breakdown.hashtag_quality.score} feedback={result.breakdown.hashtag_quality.feedback} />
            </div>

            {/* Improvements */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="font-semibold text-zinc-900 text-sm mb-3">Improvements</h3>
              <ul className="space-y-2">
                {result.improvements.map((item, i) => (
                  <li key={i} className="text-xs text-zinc-600 flex gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Rewritten */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-zinc-900 text-sm">Improved Version</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.rewritten_version);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-white text-xs text-zinc-600 hover:bg-emerald-50 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={useRewritten}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Use This <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed">{result.rewritten_version}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center">
            <BarChart3 className="w-12 h-12 text-zinc-200 mb-3" />
            <p className="text-zinc-400 text-sm">Paste a caption to get your score</p>
            <p className="text-zinc-300 text-xs mt-1">Get a 0-100 score with actionable improvements</p>
          </div>
        )}
      </div>
    </div>
  );
}
