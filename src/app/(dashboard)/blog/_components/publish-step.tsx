'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines } from '@/hooks/use-workspaces';
import { useCreatePost } from '@/hooks/use-posts';
import {
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useGenerateIgPreview,
} from '@/hooks/use-blog';
import { toast } from 'sonner';
import {
  BookOpen,
  Wand2,
  Loader2,
  Instagram,
  Copy,
  Check,
  Send,
  Hash,
  Eye,
  ArrowLeft,
  Globe,
  FileText,
} from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import type { BlogData, IgPreviewData } from './types';

interface PublishStepProps {
  blog: BlogData;
  featuredImage: string | null;
  editingPostId: string | null;
  onEditingPostIdChange: (id: string | null) => void;
  onBack: () => void;
}

export function PublishStep({
  blog,
  featuredImage,
  editingPostId,
  onEditingPostIdChange,
  onBack,
}: PublishStepProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: brandGuidelines } = useBrandGuidelines(activeWorkspace?.id);
  const createPost = useCreatePost();
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
  const publishBlogPost = usePublishBlogPost();
  const generateIgPreview = useGenerateIgPreview();

  const [editTitle, setEditTitle] = useState(blog.title);
  const [editSlug, setEditSlug] = useState(blog.slug);
  const [editExcerpt, setEditExcerpt] = useState(blog.excerpt);
  const [editMeta, setEditMeta] = useState(blog.metaDescription);
  const [editTags, setEditTags] = useState(blog.tags.join(', '));
  const [igPreview, setIgPreview] = useState<IgPreviewData | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [igSaving, setIgSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied`);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const payload = {
        title: editTitle || blog.title,
        slug: editSlug || blog.slug,
        content: blog.content,
        excerpt: editExcerpt || blog.excerpt,
        meta_description: editMeta || blog.metaDescription,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        featured_image: featuredImage || undefined,
        status: 'draft',
      };
      if (editingPostId) {
        await updateBlogPost.mutateAsync({ id: editingPostId, ...payload });
        toast.success('Draft updated');
      } else {
        const created = await createBlogPost.mutateAsync(payload);
        onEditingPostIdChange((created as Record<string, unknown>).id as string);
        toast.success('Draft saved');
      }
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const payload = {
        title: editTitle || blog.title,
        slug: editSlug || blog.slug,
        content: blog.content,
        excerpt: editExcerpt || blog.excerpt,
        meta_description: editMeta || blog.metaDescription,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        featured_image: featuredImage || undefined,
        status: 'draft',
      };
      let postId = editingPostId;
      if (postId) {
        await updateBlogPost.mutateAsync({ id: postId, ...payload });
      } else {
        const created = await createBlogPost.mutateAsync(payload);
        postId = (created as Record<string, unknown>).id as string;
        onEditingPostIdChange(postId);
      }
      await publishBlogPost.mutateAsync(postId!);
      toast.success('Blog published!');
    } catch {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateIgPreview = async () => {
    setIgLoading(true);
    try {
      const result = await generateIgPreview.mutateAsync({
        blogTitle: editTitle || blog.title,
        blogExcerpt: editExcerpt || blog.excerpt,
        blogContent: blog.content,
        brandName: activeWorkspace?.name || '',
        brandVoice: brandGuidelines?.tone_of_voice || '',
      });
      setIgPreview(result.igPreview as IgPreviewData);
      toast.success('Instagram preview created!');
    } catch {
      toast.error('IG preview generation failed');
    } finally {
      setIgLoading(false);
    }
  };

  const handleSaveIgPost = async () => {
    if (!igPreview) return;
    setIgSaving(true);
    try {
      await createPost.mutateAsync({
        caption: igPreview.caption + '\n\n' + igPreview.hashtags.map(h => `#${h}`).join(' '),
        hashtags: igPreview.hashtags,
        contentType: 'single',
        targetPlatforms: ['instagram'],
        aiGenerated: true,
        aiPrompt: `Blog promo for: ${blog.title}`,
        aiModel: 'gpt-4o',
      });
      toast.success('Instagram post saved as draft!');
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIgSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Blog preview */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-amber-600" />
          <label className="text-sm font-semibold text-zinc-900">Preview & Publish</label>
        </div>

        {/* Featured image */}
        {featuredImage && (
          <div className="relative aspect-video max-w-full rounded-lg overflow-hidden border border-zinc-200 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Editable fields */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Title</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Slug</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-zinc-400">/blog/</span>
              <input
                value={editSlug}
                onChange={e => setEditSlug(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Excerpt</label>
            <textarea
              value={editExcerpt}
              onChange={e => setEditExcerpt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Meta Description</label>
            <textarea
              value={editMeta}
              onChange={e => setEditMeta(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Tags (comma-separated)</label>
            <input
              value={editTags}
              onChange={e => setEditTags(e.target.value)}
              placeholder="real estate, barbados, beachfront"
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
            {editTags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {editTags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blog content preview */}
        <div className="border-t border-zinc-100 pt-4 max-h-[400px] overflow-y-auto pr-2 mb-4">
          <MarkdownRenderer content={blog.content} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t border-zinc-100">
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-semibold text-sm hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Save as Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* IG Promo section */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Instagram className="w-4 h-4 text-pink-500" />
          <label className="text-sm font-semibold text-zinc-900">Generate Instagram Promo</label>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Auto-generate an Instagram post that promotes this blog and drives traffic to read the full article.
        </p>

        {!igPreview ? (
          <button
            onClick={handleGenerateIgPreview}
            disabled={igLoading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-xl font-semibold text-sm hover:from-pink-400 hover:to-pink-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {igLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
            {igLoading ? 'Creating Instagram preview...' : 'Generate Instagram Post'}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Preview Card Mockup */}
            <div className="max-w-sm mx-auto">
              <div
                className="aspect-square rounded-xl overflow-hidden relative"
                style={{
                  background: `linear-gradient(135deg, ${activeWorkspace?.brand_color_primary || '#1A1A2E'}, ${activeWorkspace?.brand_color_secondary || '#C9A96E'})`,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-3">
                    {activeWorkspace?.name}
                  </p>
                  <p className="text-white text-lg font-bold leading-tight mb-2">{igPreview.cardText}</p>
                  <p className="text-white/70 text-sm">{igPreview.cardSubtext}</p>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-600">CAPTION</p>
                <button
                  onClick={() => copyText(igPreview.caption, 'Caption')}
                  className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                >
                  {copied === 'Caption' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {igPreview.caption}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Hash className="w-3 h-3 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-600">HASHTAGS ({igPreview.hashtags.length})</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {igPreview.hashtags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">#{tag}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveIgPost}
                disabled={igSaving}
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {igSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Save as Draft Post
              </button>
              <button
                onClick={handleGenerateIgPreview}
                disabled={igLoading}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-sm hover:bg-zinc-50 transition-colors flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}
