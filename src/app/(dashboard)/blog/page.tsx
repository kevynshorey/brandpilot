'use client';

import { useState, useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines } from '@/hooks/use-workspaces';
import { useCreatePost } from '@/hooks/use-posts';
import {
  useBlogPosts,
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useDeleteBlogPost,
  useResearchUrls,
  useGenerateBlog,
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
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowLeft,
  Globe,
  Search,
  Trash2,
  Edit3,
  Image,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Constants ── */
const LENGTH_OPTIONS = [
  { id: 'short', label: 'Short', desc: '400-600 words' },
  { id: 'medium', label: 'Medium', desc: '700-1000 words' },
  { id: 'long', label: 'Long', desc: '1200-1800 words' },
] as const;

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Posts' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
] as const;

/* ── Types ── */
interface BlogData {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  tags: string[];
}

interface IgPreviewData {
  caption: string;
  hashtags: string[];
  hookLine: string;
  cardText: string;
  cardSubtext: string;
}

interface ScrapedArticle {
  url: string;
  title: string;
  description: string;
  content: string;
  images: { url: string; alt: string }[];
  selected: boolean;
}

type ViewMode = 'list' | 'create' | 'edit';
type Step = 1 | 2 | 3 | 4;

/* ── Markdown Renderer ── */
function renderMarkdown(md: string) {
  return md.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-lg font-bold text-zinc-900 mt-6 mb-2">{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-base font-semibold text-zinc-800 mt-4 mb-1">{line.slice(4)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-xl font-bold text-zinc-900 mt-6 mb-3">{line.slice(2)}</h1>;
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="text-sm text-zinc-700 ml-4 list-disc">{line.slice(2)}</li>;
    }
    if (line.trim() === '') {
      return <div key={i} className="h-3" />;
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="text-sm text-zinc-700 leading-relaxed">
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="font-semibold text-zinc-900">{part}</strong>
            : part
        )}
      </p>
    );
  });
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-600',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full capitalize', styles[status] || styles.draft)}>
      {status}
    </span>
  );
}

/* ── Main Page ── */
export default function BlogPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: brandGuidelines } = useBrandGuidelines(activeWorkspace?.id);
  const createPost = useCreatePost();

  // View state
  const [view, setView] = useState<ViewMode>('list');
  const [step, setStep] = useState<Step>(1);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Blog hooks
  const { data: blogPosts = [], isLoading: postsLoading } = useBlogPosts(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { data: editingPost } = useBlogPost(editingPostId || undefined);
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
  const publishBlogPost = usePublishBlogPost();
  const deleteBlogPost = useDeleteBlogPost();
  const researchUrls = useResearchUrls();
  const generateBlog = useGenerateBlog();
  const generateIgPreview = useGenerateIgPreview();

  // Step 1: Research
  const [topic, setTopic] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [articles, setArticles] = useState<ScrapedArticle[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);

  // Step 2: Generate
  const [keywords, setKeywords] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState('');

  // Step 3: Images
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  // Step 4: Publish
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editMeta, setEditMeta] = useState('');
  const [editTags, setEditTags] = useState('');
  const [igPreview, setIgPreview] = useState<IgPreviewData | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [igSaving, setIgSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // UI
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied`);
  };

  /* ── Collected images from research ── */
  const allImages = useMemo(() => {
    const imgs: { url: string; alt: string }[] = [];
    for (const article of articles) {
      for (const img of article.images || []) {
        if (img.url && !imgs.some(i => i.url === img.url)) {
          imgs.push(img);
        }
      }
    }
    return imgs;
  }, [articles]);

  /* ── Reset form ── */
  const resetForm = useCallback(() => {
    setTopic('');
    setUrlInput('');
    setUrls([]);
    setArticles([]);
    setKeywords('');
    setLength('medium');
    setBlog(null);
    setContentDraft('');
    setEditingContent(false);
    setFeaturedImage(null);
    setEditTitle('');
    setEditSlug('');
    setEditExcerpt('');
    setEditMeta('');
    setEditTags('');
    setIgPreview(null);
    setEditingPostId(null);
  }, []);

  /* ── Switch to create mode ── */
  const startCreate = () => {
    resetForm();
    setStep(1);
    setView('create');
  };

  /* ── Switch to edit mode ── */
  const startEdit = (post: Record<string, unknown>) => {
    resetForm();
    setEditingPostId(post.id as string);
    setBlog({
      title: (post.title as string) || '',
      slug: (post.slug as string) || '',
      metaDescription: (post.meta_description as string) || '',
      content: (post.content as string) || '',
      excerpt: (post.excerpt as string) || '',
      tags: (post.tags as string[]) || [],
    });
    setEditTitle((post.title as string) || '');
    setEditSlug((post.slug as string) || '');
    setEditExcerpt((post.excerpt as string) || '');
    setEditMeta((post.meta_description as string) || '');
    setEditTags(((post.tags as string[]) || []).join(', '));
    setFeaturedImage((post.featured_image as string) || null);
    setStep(4);
    setView('edit');
  };

  /* ── Back to list ── */
  const backToList = () => {
    resetForm();
    setView('list');
    setStep(1);
  };

  /* ── Add URL ── */
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

  /* ── Research URLs ── */
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
      setArticles(scraped);
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

  /* ── Toggle article selection ── */
  const toggleArticle = (idx: number) => {
    setArticles(prev => prev.map((a, i) => i === idx ? { ...a, selected: !a.selected } : a));
  };

  /* ── Generate Blog ── */
  const handleGenerateBlog = async () => {
    if (!topic.trim()) {
      toast.error('Enter a blog topic');
      return;
    }
    setBlogLoading(true);
    setIgPreview(null);
    try {
      const selectedContent = articles.filter(a => a.selected).map(a => a.content).join('\n\n---\n\n');
      const result = await generateBlog.mutateAsync({
        topic,
        sourceContent: selectedContent || undefined,
        keywords: keywords || undefined,
        length,
        brandName: activeWorkspace?.name || '',
        brandVoice: brandGuidelines?.tone_of_voice || '',
        industry: activeWorkspace?.industry || '',
      });
      const b = result.blog as BlogData;
      setBlog(b);
      setEditTitle(b.title);
      setEditSlug(b.slug);
      setEditExcerpt(b.excerpt);
      setEditMeta(b.metaDescription);
      setEditTags(b.tags.join(', '));
      toast.success('Blog post generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blog generation failed');
    } finally {
      setBlogLoading(false);
    }
  };

  /* ── Save as Draft ── */
  const handleSaveDraft = async () => {
    if (!blog) return;
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
        setEditingPostId((created as Record<string, unknown>).id as string);
        toast.success('Draft saved');
      }
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  /* ── Publish ── */
  const handlePublish = async () => {
    if (!blog) return;
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
        setEditingPostId(postId);
      }
      await publishBlogPost.mutateAsync(postId!);
      toast.success('Blog published!');
    } catch {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    try {
      await deleteBlogPost.mutateAsync(id);
      setDeleteConfirmId(null);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  /* ── Generate IG Preview ── */
  const handleGenerateIgPreview = async () => {
    if (!blog) {
      toast.error('Generate a blog post first');
      return;
    }
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

  /* ── Save IG Post ── */
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
        aiPrompt: `Blog promo for: ${blog?.title}`,
        aiModel: 'gpt-4o',
      });
      toast.success('Instagram post saved as draft!');
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIgSaving(false);
    }
  };

  /* ── Apply inline content edits ── */
  const applyContentEdits = () => {
    if (blog) {
      setBlog({ ...blog, content: contentDraft });
      setEditingContent(false);
      toast.success('Content updated');
    }
  };

  /* ════════════════════════════════════════════════════════
     RENDER: LIST VIEW
  ════════════════════════════════════════════════════════ */
  if (view === 'list') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Blog</h1>
            <p className="text-sm text-zinc-500">
              {activeWorkspace?.name || 'Select a workspace'} — Manage blog posts and generate new content
            </p>
          </div>
          <button
            onClick={startCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>

        {/* Tabs + Filter */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-zinc-900">My Posts</span>
              <span className="text-xs text-zinc-400 ml-1">({blogPosts.length})</span>
            </div>

            {/* Status filter */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5"
              >
                {STATUS_OPTIONS.find(s => s.id === statusFilter)?.label || 'All Posts'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setStatusFilter(opt.id); setShowStatusDropdown(false); }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 transition-colors',
                        statusFilter === opt.id ? 'text-amber-700 font-medium bg-amber-50' : 'text-zinc-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Posts table */}
          {postsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-300 animate-spin mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Loading posts...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">No blog posts yet</p>
              <p className="text-xs text-zinc-400 mt-1">Create your first blog post to get started</p>
              <button
                onClick={startCreate}
                className="mt-4 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Create First Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Title</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tags</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Published</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.map((post: Record<string, unknown>) => (
                    <tr
                      key={post.id as string}
                      className="border-b border-zinc-50 hover:bg-zinc-50/50 cursor-pointer transition-colors"
                      onClick={() => startEdit(post)}
                    >
                      <td className="py-3 px-3">
                        <p className="font-medium text-zinc-900 truncate max-w-[280px]">
                          {(post.title as string) || 'Untitled'}
                        </p>
                        <p className="text-xs text-zinc-400 truncate max-w-[280px]">
                          /{(post.slug as string) || ''}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={(post.status as string) || 'draft'} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {((post.tags as string[]) || []).slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {((post.tags as string[]) || []).length > 3 && (
                            <span className="text-xs text-zinc-400">+{((post.tags as string[]) || []).length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-zinc-500">
                        {post.published_at
                          ? new Date(post.published_at as string).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => startEdit(post)}
                            className="p-1.5 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirmId === (post.id as string) ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(post.id as string)}
                                className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs font-medium text-zinc-500 bg-zinc-50 rounded hover:bg-zinc-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(post.id as string)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     RENDER: CREATE / EDIT VIEW
  ════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={backToList}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {view === 'edit' ? 'Edit Post' : 'Create New Post'}
            </h1>
            <p className="text-sm text-zinc-500">
              {activeWorkspace?.name || 'Select a workspace'} — Step {step} of 4
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center gap-1">
          {[
            { num: 1, label: 'Research', icon: Search },
            { num: 2, label: 'Generate', icon: Wand2 },
            { num: 3, label: 'Images', icon: Image },
            { num: 4, label: 'Publish', icon: Globe },
          ].map(({ num, label, icon: Icon }, idx) => (
            <div key={num} className="flex items-center flex-1">
              <button
                onClick={() => setStep(num as Step)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full',
                  step === num
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : step > num
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-zinc-400 hover:bg-zinc-50'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  step === num
                    ? 'bg-amber-400 text-zinc-900'
                    : step > num
                    ? 'bg-green-100 text-green-700'
                    : 'bg-zinc-100 text-zinc-400'
                )}>
                  {step > num ? <Check className="w-3 h-3" /> : num}
                </div>
                <Icon className="w-3.5 h-3.5 hidden sm:block" />
                <span className="hidden sm:inline">{label}</span>
              </button>
              {idx < 3 && <div className={cn('w-4 h-px mx-1', step > num ? 'bg-green-200' : 'bg-zinc-200')} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Research ── */}
      {step === 1 && (
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
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. 5 Things to Know Before Buying Beachfront Property in Barbados"
              rows={3}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
            />
          </div>

          {/* URL input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
              Source URLs (up to 5)
            </label>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addUrl()}
                placeholder="https://example.com/article"
                className="flex-1 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
              <button
                onClick={addUrl}
                disabled={urls.length >= 5}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add URL
              </button>
            </div>
          </div>

          {/* URL list */}
          {urls.length > 0 && (
            <div className="mb-4 space-y-2">
              {urls.map(url => (
                <div key={url} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-xs text-zinc-600 truncate">{url}</span>
                  </div>
                  <button onClick={() => removeUrl(url)} className="p-1 text-zinc-400 hover:text-red-500 shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Research button */}
          {urls.length > 0 && (
            <button
              onClick={handleResearch}
              disabled={researchLoading}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
            >
              {researchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {researchLoading ? 'Researching...' : `Research ${urls.length} URL${urls.length > 1 ? 's' : ''}`}
            </button>
          )}

          {/* Scraped articles */}
          {articles.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                Scraped Articles ({articles.filter(a => a.selected).length} selected)
              </p>
              {articles.map((article, idx) => (
                <div key={idx} className={cn(
                  'border rounded-lg p-3 transition-colors',
                  article.selected ? 'border-amber-200 bg-amber-50/30' : 'border-zinc-200 bg-white'
                )}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={article.selected}
                      onChange={() => toggleArticle(idx)}
                      className="mt-1 w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{article.title || article.url}</p>
                      {article.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{article.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!topic.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all disabled:opacity-50 shadow-sm"
            >
              Next: Generate
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Generate ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Source summary */}
          {articles.filter(a => a.selected).length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-zinc-900">
                  {articles.filter(a => a.selected).length} source(s) selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {articles.filter(a => a.selected).map((a, i) => (
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
              placeholder="SEO keywords (optional): beachfront property, Barbados real estate"
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
                  {renderMarkdown(blog.content)}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!blog}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all disabled:opacity-50 shadow-sm"
            >
              Next: Images
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Images ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-4 h-4 text-amber-600" />
              <label className="text-sm font-semibold text-zinc-900">Featured Image</label>
            </div>

            {allImages.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No images found from research</p>
                <p className="text-xs text-zinc-400 mt-1">Add URLs in Step 1 and research them to find images</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-500 mb-4">
                  Select a featured image from your researched articles ({allImages.length} found)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFeaturedImage(img.url === featuredImage ? null : img.url)}
                      className={cn(
                        'relative aspect-video rounded-lg overflow-hidden border-2 transition-all group',
                        featuredImage === img.url
                          ? 'border-amber-400 ring-2 ring-amber-200'
                          : 'border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt || 'Article image'}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {featuredImage === img.url && (
                        <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-amber-700" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Featured image preview */}
            {featuredImage && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-2">FEATURED IMAGE PREVIEW</p>
                <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden border border-amber-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setFeaturedImage(null)}
                  className="mt-2 text-xs text-red-500 hover:text-red-600"
                >
                  Remove featured image
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-sm"
            >
              Next: Publish
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Publish ── */}
      {step === 4 && blog && (
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
              {renderMarkdown(blog.content)}
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
              onClick={() => setStep(3)}
              className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 4 but no blog yet */}
      {step === 4 && !blog && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No blog content yet</p>
            <p className="text-xs text-zinc-400 mt-1">Go back to Step 2 to generate your blog post first</p>
            <button
              onClick={() => setStep(2)}
              className="mt-4 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Go to Generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
