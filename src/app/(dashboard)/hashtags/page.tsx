'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines } from '@/hooks/use-workspaces';
import { toast } from 'sonner';
import {
  Hash,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Pin,
  TrendingUp,
  Target,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', limit: '30 max' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', limit: '3-5 recommended' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'text-zinc-600', limit: '2-3 recommended' },
  { id: 'pinterest', label: 'Pinterest', icon: Pin, color: 'text-red-500', limit: '20 max' },
  { id: 'tiktok', label: 'TikTok', icon: TrendingUp, color: 'text-zinc-800', limit: '5-8 recommended' },
];

interface HashtagGroup {
  label: string;
  hashtags: string[];
  description: string;
}

interface HashtagResult {
  groups: HashtagGroup[];
  recommended_set: string[];
  caption_tip: string;
}

export default function HashtagsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: guidelines } = useBrandGuidelines(activeWorkspace?.id);

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashtagResult | null>(null);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          niche: niche.trim() || guidelines?.tone_of_voice || '',
          count: platform === 'instagram' ? 30 : 15,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const data = await resp.json();
      setResult(data);
      toast.success('Hashtags generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate hashtags');
    } finally {
      setLoading(false);
    }
  };

  const copyHashtags = (hashtags: string[], label: string) => {
    navigator.clipboard.writeText(hashtags.join(' '));
    setCopiedGroup(label);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedGroup(null), 2000);
  };

  const groupIcons = [TrendingUp, Target, Zap, Star];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">AI Hashtag Generator</h1>
        <p className="text-zinc-500 mt-1">Generate optimized hashtags grouped by reach and competition</p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Topic or Post Description</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., Summer skincare routine for oily skin"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-zinc-400 mt-1">{topic.length}/500</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                      platform === p.id
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', platform === p.id ? 'text-amber-500' : p.color)} />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              {PLATFORMS.find(p => p.id === platform)?.limit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Niche / Industry (optional)</label>
            <input
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder={guidelines?.tone_of_voice ? `Using: ${guidelines.tone_of_voice}` : 'e.g., Luxury fashion'}
              maxLength={200}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Hashtags'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Recommended Set */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-zinc-900">Recommended Set</h3>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {result.recommended_set.length} tags
                </span>
              </div>
              <button
                onClick={() => copyHashtags(result.recommended_set, 'recommended')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors"
              >
                {copiedGroup === 'recommended' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedGroup === 'recommended' ? 'Copied' : 'Copy All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.recommended_set.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-white border border-amber-200 rounded-full text-sm text-zinc-700">
                  {tag}
                </span>
              ))}
            </div>
            {result.caption_tip && (
              <p className="mt-3 text-sm text-amber-700 bg-amber-100/50 rounded-lg px-3 py-2">
                💡 {result.caption_tip}
              </p>
            )}
          </div>

          {/* Grouped Hashtags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.groups.map((group, i) => {
              const GroupIcon = groupIcons[i % groupIcons.length];
              return (
                <div key={group.label} className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GroupIcon className="w-4 h-4 text-zinc-400" />
                      <h3 className="font-medium text-zinc-900 text-sm">{group.label}</h3>
                      <span className="text-xs text-zinc-400">{group.hashtags.length}</span>
                    </div>
                    <button
                      onClick={() => copyHashtags(group.hashtags, group.label)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
                      title="Copy all"
                    >
                      {copiedGroup === group.label ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{group.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.hashtags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                          toast.success(`Copied ${tag}`);
                        }}
                        className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-full text-xs text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-12">
          <Hash className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Enter a topic and generate optimized hashtags</p>
        </div>
      )}
    </div>
  );
}
