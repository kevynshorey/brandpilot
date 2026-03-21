'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Pin,
  TrendingUp,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Hash,
  Target,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'X', icon: Twitter },
  { id: 'tiktok', label: 'TikTok', icon: TrendingUp },
  { id: 'pinterest', label: 'Pinterest', icon: Pin },
];

interface ContentIdea {
  idea: string;
  why: string;
}

interface CompetitorResult {
  competitor: { name: string; platform: string; estimated_followers: string; posting_frequency: string; primary_content_types: string[] };
  content_strategy: { themes: string[]; tone: string; visual_style: string; engagement_tactics: string[] };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  content_ideas: ContentIdea[];
  hashtags_they_use: string[];
  summary: string;
}

export default function CompetitorsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [competitor, setCompetitor] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [copiedIdea, setCopiedIdea] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!competitor.trim()) { toast.error('Enter a competitor name'); return; }
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch('/api/ai/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitor: competitor.trim(),
          platform,
          yourBrand: activeWorkspace?.name || '',
        }),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || 'Failed');
      setResult(await resp.json());
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Competitor Spy</h1>
        <p className="text-zinc-500 mt-1">AI-powered competitive analysis with actionable content ideas</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Competitor Name or Handle</label>
          <input
            type="text"
            value={competitor}
            onChange={e => setCompetitor(e.target.value)}
            placeholder="e.g., Nike, @glossier, Buffer"
            maxLength={200}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                    platform === p.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-zinc-200 text-zinc-500'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !competitor.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze Competitor'}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-800 leading-relaxed">{result.summary}</p>
          </div>

          {/* Overview */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-zinc-900">Overview</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-400">Followers</p>
                <p className="text-sm font-medium text-zinc-900">{result.competitor.estimated_followers}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Posting Frequency</p>
                <p className="text-sm font-medium text-zinc-900">{result.competitor.posting_frequency}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Content Types</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {result.competitor.primary_content_types.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-600">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Tone</p>
                <p className="text-sm font-medium text-zinc-900">{result.content_strategy.tone}</p>
              </div>
            </div>
          </div>

          {/* Strategy + SWOT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Content Strategy */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
              <h3 className="font-semibold text-zinc-900 text-sm">Content Strategy</h3>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Themes / Pillars</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.content_strategy.themes.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-xs text-violet-700">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Visual Style</p>
                <p className="text-xs text-zinc-600">{result.content_strategy.visual_style}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Engagement Tactics</p>
                <ul className="space-y-1">
                  {result.content_strategy.engagement_tactics.map(t => (
                    <li key={t} className="text-xs text-zinc-600">• {t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                  <h3 className="font-semibold text-zinc-900 text-sm">Strengths</h3>
                </div>
                <ul className="space-y-1">
                  {result.strengths.map(s => (
                    <li key={s} className="text-xs text-zinc-600 flex gap-1.5"><span className="text-emerald-500">✓</span>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                  <h3 className="font-semibold text-zinc-900 text-sm">Weaknesses</h3>
                </div>
                <ul className="space-y-1">
                  {result.weaknesses.map(w => (
                    <li key={w} className="text-xs text-zinc-600 flex gap-1.5"><span className="text-red-400">✗</span>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-zinc-900">Your Opportunities</h3>
            </div>
            <ul className="space-y-2">
              {result.opportunities.map((o, i) => (
                <li key={i} className="text-sm text-emerald-800 flex gap-2">
                  <span className="text-emerald-500 font-bold">{i + 1}.</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>

          {/* Content Ideas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-zinc-900">Content Ideas to Beat Them</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.content_ideas.map((idea, i) => (
                <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase text-amber-500">Idea {i + 1}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(idea.idea);
                        setCopiedIdea(i);
                        setTimeout(() => setCopiedIdea(null), 2000);
                      }}
                      className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors"
                    >
                      {copiedIdea === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm text-zinc-800 font-medium mb-1.5">{idea.idea}</p>
                  <p className="text-xs text-zinc-500">{idea.why}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Their Hashtags */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-zinc-900 text-sm">Hashtags They Use</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.hashtags_they_use.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-zinc-50 border border-zinc-100 rounded-full text-xs text-zinc-600">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Enter a competitor to analyze their strategy</p>
        </div>
      )}
    </div>
  );
}
