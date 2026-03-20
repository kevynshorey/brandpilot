'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines } from '@/hooks/use-workspaces';
import { useGenerateBlog } from '@/hooks/use-blog';
import { toast } from 'sonner';
import {
  BookOpen,
  Wand2,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Edit3,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';
import { LENGTH_OPTIONS } from './constants';
import type { BlogData, ScrapedArticle } from './types';

interface GenerateStepProps {
  topic: string;
  articles: ScrapedArticle[];
  blog: BlogData | null;
  onBlogChange: (blog: BlogData) => void;
  onBack: () => void;
  onNext: () => void;
}

export function GenerateStep({
  topic,
  articles,
  blog,
  onBlogChange,
  onBack,
  onNext,
}: GenerateStepProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: brandGuidelines } = useBrandGuidelines(activeWorkspace?.id);
  const generateBlog = useGenerateBlog();

  const [keywords, setKeywords] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [blogLoading, setBlogLoading] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const selectedArticles = articles.filter(a => a.selected);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied`);
  };

  const handleGenerateBlog = async () => {
    if (!topic.trim()) {
      toast.error('Enter a blog topic');
      return;
    }
    setBlogLoading(true);
    try {
      const selectedContent = selectedArticles.map(a => a.content).join('\n\n---\n\n');
      const result = await generateBlog.mutateAsync({
        topic,
        sourceContent: selectedContent || undefined,
        keywords: keywords || undefined,
        length,
        brandName: activeWorkspace?.name || '',
        brandVoice: brandGuidelines?.tone_of_voice || '',
        industry: activeWorkspace?.industry || '',
      });
      onBlogChange(result.blog as BlogData);
      toast.success('Blog post generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blog generation failed');
    } finally {
      setBlogLoading(false);
    }
  };

  const applyContentEdits = () => {
    if (blog) {
      onBlogChange({ ...blog, content: contentDraft });
      setEditingContent(false);
      toast.success('Content updated');
    }
  };

  return (
    <div className="space-y-4">
      {/* Source summary */}
      {selectedArticles.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-zinc-900">
              {selectedArticles.length} source(s) selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedArticles.map((a, i) => (
              <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full truncate max-w-[200px]">
                {a.title || a.url}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generation controls */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-4 h-4 text-amber-600" />
          <label className="text-sm font-semibold text-zinc-900">Generate Blog Post</label>
        </div>

        {/* Topic display */}
        <div className="mb-3 p-3 bg-zinc-50 rounded-lg">
          <p className="text-xs font-medium text-zinc-500 mb-1">TOPIC</p>
          <p className="text-sm text-zinc-900">{topic || 'No topic set — go back to Step 1'}</p>
        </div>

        {/* Keywords */}
        <input
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="SEO keywords (optional): e.g. content marketing, social media strategy"
          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 mb-4"
        />

        {/* Length selector */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-zinc-600">Length:</span>
          {LENGTH_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setLength(opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                length === opt.id
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
              )}
            >
              {opt.label} <span className="text-zinc-400 font-normal">({opt.desc})</span>
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerateBlog}
          disabled={blogLoading || !topic.trim()}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {blogLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {blogLoading ? 'Writing blog post...' : 'Generate with Claude'}
        </button>
      </div>

      {/* Blog preview / editor */}
      {blog && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-zinc-900">Generated Blog Post</label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(blog.content, 'Blog content')}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5"
              >
                {copied === 'Blog content' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                Copy
              </button>
              <button
                onClick={() => {
                  if (!editingContent) setContentDraft(blog.content);
                  setEditingContent(!editingContent);
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium border rounded-lg flex items-center gap-1.5',
                  editingContent
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                )}
              >
                <Edit3 className="w-3 h-3" />
                {editingContent ? 'Editing' : 'Edit'}
              </button>
              <button
                onClick={handleGenerateBlog}
                disabled={blogLoading}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Wand2 className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 mb-2">{blog.title}</h2>

          {editingContent ? (
            <div>
              <textarea
                value={contentDraft}
                onChange={e => setContentDraft(e.target.value)}
                rows={20}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-y"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={applyContentEdits}
                  className="px-4 py-2 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Apply Changes
                </button>
                <button
                  onClick={() => setEditingContent(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-zinc-100 pt-4 max-h-[500px] overflow-y-auto pr-2">
              <MarkdownRenderer content={blog.content} />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!blog}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all disabled:opacity-50 shadow-sm"
        >
          Next: Images
        </button>
      </div>
    </div>
  );
}
