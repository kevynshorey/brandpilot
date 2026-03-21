'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { toast } from 'sonner';
import {
  Repeat2,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Hash,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { PlatformPreview } from '@/components/preview/platform-preview';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'text-zinc-700' },
  { id: 'pinterest', label: 'Pinterest', icon: Globe, color: 'text-red-500' },
  { id: 'tiktok', label: 'TikTok', icon: Globe, color: 'text-zinc-900' },
];

interface PlatformVersion {
  caption: string;
  hashtags: string[];
  contentTip: string;
}

export default function RepurposePage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin', 'twitter']);
  const [versions, setVersions] = useState<Record<string, PlatformVersion> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleRepurpose = async () => {
    if (!content.trim() || content.trim().length < 10) {
      toast.error('Write at least 10 characters to repurpose');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    setLoading(true);
    setVersions(null);

    try {
      const res = await fetch('/api/ai/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          platforms: selectedPlatforms,
          brandVoice: '', // Could pull from brand guidelines
          industry: activeWorkspace?.industry || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to repurpose');

      setVersions(data.versions);
      toast.success(`Generated ${Object.keys(data.versions).length} platform versions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Repurposing failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Repeat2 className="w-6 h-6 text-amber-500" />
          Content Repurposer
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Paste one piece of content and get AI-optimized versions for every platform.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Original Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your blog post excerpt, email copy, product description, or any content you want to adapt for social media..."
            rows={6}
            maxLength={3000}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
          />
          <p className="text-xs text-zinc-400 mt-1 text-right">{content.length}/3,000</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Target Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePlatform(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedPlatforms.includes(id)
                    ? 'bg-amber-500 text-zinc-900 shadow-sm'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${selectedPlatforms.includes(id) ? 'text-zinc-900' : color}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRepurpose}
          disabled={loading || content.trim().length < 10 || selectedPlatforms.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Repurpose for All Platforms'}
        </button>
      </div>

      {/* Results */}
      {versions && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Platform Versions</h2>
          <div className="grid gap-4">
            {Object.entries(versions).map(([platform, version]) => {
              const platformInfo = PLATFORMS.find((p) => p.id === platform);
              const Icon = platformInfo?.icon || Globe;
              const fullText = version.caption + (version.hashtags.length > 0
                ? '\n\n' + version.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')
                : '');

              return (
                <div key={platform} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  {/* Platform header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${platformInfo?.color || 'text-zinc-500'}`} />
                      <span className="text-sm font-semibold text-zinc-900">{platformInfo?.label || platform}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewPlatform(previewPlatform === platform ? null : platform)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                          previewPlatform === platform
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button
                        onClick={() => copyToClipboard(fullText, platform)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        {copiedId === platform ? (
                          <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="p-5">
                    <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">{version.caption}</p>

                    {version.hashtags.length > 0 && (
                      <div className="mt-3 flex items-start gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-500">
                          {version.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}
                        </p>
                      </div>
                    )}

                    {version.contentTip && (
                      <div className="mt-3 flex items-start gap-1.5 px-3 py-2 bg-amber-50 rounded-lg">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">{version.contentTip}</p>
                      </div>
                    )}

                    {/* Platform mockup preview */}
                    {previewPlatform === platform && (
                      <div className="mt-4 pt-4 border-t border-zinc-100">
                        <p className="text-xs font-medium text-zinc-500 mb-3">How it looks on {platformInfo?.label}:</p>
                        <div className="flex justify-center">
                          <PlatformPreview
                            platform={platform}
                            caption={version.caption}
                            hashtags={version.hashtags}
                            accountName={activeWorkspace?.name}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
