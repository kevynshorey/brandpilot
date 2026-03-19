'use client';

import { useState } from 'react';
import { useResearchUrls } from '@/hooks/use-blog';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  FileText,
  Image,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScrapedArticle } from './types';

interface ResearchStepProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  articles: ScrapedArticle[];
  onArticlesChange: (articles: ScrapedArticle[]) => void;
  onNext: () => void;
}

export function ResearchStep({
  topic,
  onTopicChange,
  articles,
  onArticlesChange,
  onNext,
}: ResearchStepProps) {
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const researchUrls = useResearchUrls();

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (urls.length >= 5) {
      toast.error('Maximum 5 URLs allowed');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast.error('Enter a valid URL');
      return;
    }
    if (urls.includes(trimmed)) {
      toast.error('URL already added');
      return;
    }
    setUrls(prev => [...prev, trimmed]);
    setUrlInput('');
  };

  const removeUrl = (url: string) => {
    setUrls(prev => prev.filter(u => u !== url));
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleResearch = async () => {
    if (urls.length === 0) {
      toast.error('Add at least one URL to research');
      return;
    }
    setResearchLoading(true);
    try {
      const result = await researchUrls.mutateAsync(urls);
      const scraped = (result.articles || []).map((a: Record<string, unknown>) => ({
        ...a,
        selected: true,
        images: (a.images as { url: string; alt: string }[]) || [],
      })) as ScrapedArticle[];
      onArticlesChange(scraped);
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} URL(s) failed to load`);
      } else {
        toast.success(`${scraped.length} article(s) scraped`);
      }
    } catch {
      toast.error('Research failed');
    } finally {
      setResearchLoading(false);
    }
  };

  const toggleArticle = (idx: number) => {
    onArticlesChange(articles.map((a, i) => i === idx ? { ...a, selected: !a.selected } : a));
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-amber-600" />
        <label className="text-sm font-semibold text-zinc-900">Research & Sources</label>
      </div>

      {/* Topic */}
      <div className="mb-4">
        <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Blog Topic</label>
        <textarea
          value={topic}
          onChange={e => onTopicChange(e.target.value)}
          placeholder="e.g. 5 Things to Know Before Buying Beachfront Property in Barbados"
          rows={3}
          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
        />
      </div>

      {/* URL input */}
      <div className="mb-3">
        <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
          Source URLs <span className="text-zinc-400">({urls.length}/5)</span>
        </label>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addUrl()}
            placeholder="Paste a URL and press Enter"
            className="flex-1 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button
            onClick={addUrl}
            disabled={urls.length >= 5}
            className="px-3 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
            title="Add URL"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL chips */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {urls.map(url => (
            <span
              key={url}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full text-xs text-zinc-700 max-w-[260px] group hover:border-zinc-300 transition-colors"
            >
              <span className="truncate">{getDomain(url)}</span>
              <button
                onClick={() => removeUrl(url)}
                className="p-0.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Research button */}
      {urls.length > 0 && articles.length === 0 && (
        <button
          onClick={handleResearch}
          disabled={researchLoading}
          className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
        >
          {researchLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scraping {urls.length} source{urls.length > 1 ? 's' : ''}...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Research {urls.length} Source{urls.length > 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      )}

      {/* Scraped articles — collapsible */}
      {articles.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              {articles.filter(a => a.selected).length} of {articles.length} sources selected
            </p>
            <button
              onClick={handleResearch}
              disabled={researchLoading}
              className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
            >
              {researchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Re-scrape
            </button>
          </div>

          {articles.map((article, idx) => {
            const isExpanded = expandedArticle === idx;
            return (
              <div key={idx} className={cn(
                'border rounded-lg transition-colors overflow-hidden',
                article.selected ? 'border-amber-200 bg-amber-50/30' : 'border-zinc-200 bg-white'
              )}>
                {/* Header row */}
                <div className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={article.selected}
                    onChange={() => toggleArticle(idx)}
                    className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{article.title || article.url}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {article.content ? `${article.content.split(' ').length} words` : 'No content'}
                      </span>
                      {article.images?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          {article.images.length} images
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedArticle(isExpanded ? null : idx)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Collapsible content */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-zinc-100">
                    {article.description && (
                      <p className="text-xs text-zinc-500 mt-2 mb-2">{article.description}</p>
                    )}
                    {article.content && (
                      <div className="bg-zinc-50 rounded-lg p-3 mt-2 max-h-[200px] overflow-y-auto">
                        <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">
                          {article.content.slice(0, 1000)}
                          {article.content.length > 1000 && '...'}
                        </p>
                      </div>
                    )}
                    {article.images?.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {article.images.slice(0, 6).map((img, imgIdx) => (
                          <div key={imgIdx} className="w-16 h-16 rounded border border-zinc-200 overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.alt || ''}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onNext}
          disabled={!topic.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all disabled:opacity-50 shadow-sm"
        >
          Next: Generate
        </button>
      </div>
    </div>
  );
}
