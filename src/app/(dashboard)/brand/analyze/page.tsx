'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Loader2,
  Globe,
  FileText,
  Sparkles,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Target,
  Users,
  MessageSquare,
  BarChart3,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAnalysis {
  voice_profile: {
    tone: string;
    personality: string;
    formality_score: number;
    energy_score: number;
    warmth_score: number;
  };
  writing_patterns: {
    sentence_style: string;
    vocabulary_level: string;
    common_phrases: string[];
    punctuation_style: string;
  };
  audience_signals: {
    target_audience: string;
    industry: string;
    values: string[];
  };
  recommendations: {
    social_tone: string;
    do_more: string[];
    avoid: string[];
    sample_caption: string;
  };
  summary: string;
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium text-zinc-700">{score}/10</span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}

export default function AnalyzeVoicePage() {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoiceAnalysis | null>(null);
  const [captionCopied, setCaptionCopied] = useState(false);

  const handleAnalyze = async () => {
    const input = mode === 'url' ? url.trim() : text.trim();
    if (!input) {
      toast.error(mode === 'url' ? 'Enter a URL' : 'Paste some text');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch('/api/ai/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'url' ? { url: input } : { text: input }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await resp.json();
      setResult(data);
      toast.success('Voice analysis complete!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/brand" className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Brand Voice Analyzer</h1>
          <p className="text-zinc-500 mt-0.5">Paste a URL or text to extract brand voice characteristics</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('url')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === 'url' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            )}
          >
            <Globe className="w-4 h-4" />
            Analyze URL
          </button>
          <button
            onClick={() => setMode('text')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === 'text' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            )}
          >
            <FileText className="w-4 h-4" />
            Paste Text
          </button>
        </div>

        {mode === 'url' ? (
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/about"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        ) : (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste existing brand copy, website text, social media captions, or marketing content here..."
            rows={6}
            maxLength={5000}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || (mode === 'url' ? !url.trim() : !text.trim())}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze Voice'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-800 leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voice Profile */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-zinc-900">Voice Profile</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Tone</span>
                  <span className="text-sm font-medium text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                    {result.voice_profile.tone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Personality</span>
                  <span className="text-sm font-medium text-zinc-900">{result.voice_profile.personality}</span>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <ScoreBar label="Formality" score={result.voice_profile.formality_score} color="bg-blue-500" />
                <ScoreBar label="Energy" score={result.voice_profile.energy_score} color="bg-amber-500" />
                <ScoreBar label="Warmth" score={result.voice_profile.warmth_score} color="bg-rose-400" />
              </div>
            </div>

            {/* Writing Patterns */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-zinc-900">Writing Patterns</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-zinc-500">Sentence Style:</span>
                  <p className="text-zinc-700 mt-0.5">{result.writing_patterns.sentence_style}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Vocabulary:</span>
                  <span className="ml-2 font-medium text-zinc-700">{result.writing_patterns.vocabulary_level}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Punctuation:</span>
                  <p className="text-zinc-700 mt-0.5">{result.writing_patterns.punctuation_style}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Common Phrases:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {result.writing_patterns.common_phrases.map(phrase => (
                      <span key={phrase} className="px-2 py-0.5 bg-zinc-100 rounded text-xs text-zinc-600">
                        &ldquo;{phrase}&rdquo;
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Audience */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-zinc-900">Audience Signals</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-zinc-500">Target Audience:</span>
                  <p className="text-zinc-700 mt-0.5">{result.audience_signals.target_audience}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Industry:</span>
                  <span className="ml-2 font-medium text-zinc-700">{result.audience_signals.industry}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Core Values:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {result.audience_signals.values.map(v => (
                      <span key={v} className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-zinc-400" />
                <h3 className="font-semibold text-zinc-900">Recommendations</h3>
              </div>
              <div className="text-sm space-y-3">
                <div>
                  <span className="text-zinc-500">Social Media Tone:</span>
                  <p className="text-zinc-700 mt-0.5 font-medium">{result.recommendations.social_tone}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    Do More
                  </div>
                  <ul className="space-y-1">
                    {result.recommendations.do_more.map(item => (
                      <li key={item} className="text-zinc-600 text-xs flex gap-1.5">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                    Avoid
                  </div>
                  <ul className="space-y-1">
                    {result.recommendations.avoid.map(item => (
                      <li key={item} className="text-zinc-600 text-xs flex gap-1.5">
                        <span className="text-red-400 mt-0.5">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Caption */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900 text-sm">Sample Caption in This Voice</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.recommendations.sample_caption);
                  setCaptionCopied(true);
                  toast.success('Caption copied!');
                  setTimeout(() => setCaptionCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
              >
                {captionCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {captionCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-zinc-700 whitespace-pre-line bg-zinc-50 rounded-lg p-4 leading-relaxed">
              {result.recommendations.sample_caption}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Paste a URL or text to discover its brand voice</p>
          <p className="text-zinc-300 text-xs mt-1">Works with websites, blog posts, About pages, marketing copy</p>
        </div>
      )}
    </div>
  );
}
