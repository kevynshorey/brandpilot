'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines } from '@/hooks/use-workspaces';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Instagram,
  Linkedin,
  Twitter,
  Pin,
  TrendingUp,
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

const TONES = ['Professional', 'Casual', 'Witty', 'Inspirational', 'Educational', 'Playful', 'Bold'];

interface CaptionResult {
  caption: string;
  hashtags: string[];
}

export default function CaptionsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: guidelines } = useBrandGuidelines(activeWorkspace?.id);

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CaptionResult[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setLoading(true);

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'caption',
          topic: topic.trim(),
          brandVoice: tone || guidelines?.tone_of_voice || '',
          platform,
        }),
      });

      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || 'Failed');
      const data = await resp.json();

      // Parse the response — the generate endpoint returns { content }
      const content = data.content || data.caption || '';
      const hashtagMatch = content.match(/#\w+/g) || [];
      const captionText = content.replace(/#\w+/g, '').trim();

      // Generate 3 variations by calling 3 times in parallel
      const variations: CaptionResult[] = [{ caption: captionText, hashtags: hashtagMatch }];

      // Make 2 more quick calls for variety
      const extraCalls = [1, 2].map(async () => {
        try {
          const r = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'caption',
              topic: topic.trim() + (tone ? ` (${tone} tone)` : ''),
              brandVoice: guidelines?.tone_of_voice || '',
              platform,
            }),
          });
          if (!r.ok) return null;
          const d = await r.json();
          const c = d.content || d.caption || '';
          const h = c.match(/#\w+/g) || [];
          return { caption: c.replace(/#\w+/g, '').trim(), hashtags: h };
        } catch { return null; }
      });

      const extras = await Promise.all(extraCalls);
      extras.forEach(e => { if (e) variations.push(e); });

      setResults(variations);
      toast.success(`${variations.length} caption${variations.length > 1 ? 's' : ''} generated!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = (text: string, hashtags: string[], idx: number) => {
    const full = hashtags.length > 0 ? `${text}\n\n${hashtags.join(' ')}` : text;
    navigator.clipboard.writeText(full);
    setCopiedIdx(idx);
    toast.success('Copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Quick Caption Writer</h1>
        <p className="text-zinc-500 mt-1">Generate multiple caption variations instantly</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">What&apos;s the post about?</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., New product launch, Summer sale, Team photo"
            maxLength={300}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(tone === t ? '' : t)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    tone === t ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Writing...' : 'Generate Captions'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">{results.length} Variation{results.length > 1 ? 's' : ''}</h2>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Regenerate
            </button>
          </div>

          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 mb-2 block">
                    Option {i + 1}
                  </span>
                  <p className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed">
                    {r.caption}
                  </p>
                  {r.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {r.hashtags.map(h => (
                        <span key={h} className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-full text-[11px] text-zinc-500">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyCaption(r.caption, r.hashtags, i)}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
                  >
                    {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === i ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('template_prefill', JSON.stringify({ caption: r.caption, hashtags: r.hashtags }));
                      window.location.href = '/create';
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium hover:bg-amber-100 transition-colors"
                  >
                    Use <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Describe your post and get instant caption variations</p>
        </div>
      )}
    </div>
  );
}
