'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useCreatePost } from '@/hooks/use-posts';
import { useBrandGuidelines } from '@/hooks/use-workspaces';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Image as ImageIcon,
  Send,
  Hash,
  Wand2,
  Plus,
  X,
  Instagram,
  Linkedin,
  Twitter,
  Loader2,
  Globe,
  Search,
  Sparkles,
  Target,
  Megaphone,
  BookOpen,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  Pin,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Constants ── */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'twitter', label: 'X', icon: Twitter, color: 'text-zinc-400' },
  { id: 'facebook', label: 'Facebook', icon: Linkedin, color: 'text-blue-500' },
  { id: 'threads', label: 'Threads', icon: Instagram, color: 'text-zinc-600' },
  { id: 'pinterest', label: 'Pinterest', icon: Pin, color: 'text-red-500' },
] as const;

const CONTENT_TYPES = [
  { id: 'single', label: 'Single Post', desc: 'One image + caption', icon: ImageIcon },
  { id: 'carousel', label: 'Carousel', desc: 'Multi-slide post', icon: LayoutGrid },
  { id: 'text_only', label: 'Text Only', desc: 'No media', icon: MessageSquare },
  { id: 'ad', label: 'Ad Campaign', desc: 'Paid ad creative', icon: Megaphone },
  { id: 'reel_script', label: 'Reel Script', desc: 'Video script', icon: TrendingUp },
  { id: 'blog_promo', label: 'Blog Promo', desc: 'Promote a blog post', icon: BookOpen },
] as const;

const GOALS = [
  { id: 'awareness', label: 'Brand Awareness', icon: Sparkles },
  { id: 'engagement', label: 'Engagement', icon: MessageSquare },
  { id: 'conversion', label: 'Sales / Conversion', icon: Target },
  { id: 'traffic', label: 'Website Traffic', icon: ExternalLink },
] as const;

const STYLES = [
  'educational', 'storytelling', 'promotional', 'behind_the_scenes', 'user_generated', 'controversial',
] as const;

/* ── Types ── */
interface ScrapedImage {
  url: string;
  alt: string;
}

interface ScrapedData {
  title: string;
  description: string;
  images: ScrapedImage[];
  ogImage: string | null;
}

interface CarouselSlide {
  headline: string;
  body: string;
  imagePrompt: string;
}

/* ── Page ── */
export default function CreatePostPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const createPost = useCreatePost();
  const { data: brandGuidelines } = useBrandGuidelines(activeWorkspace?.id);

  // Core state
  const [contentType, setContentType] = useState<string>('single');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [goal, setGoal] = useState<string>('engagement');
  const [style, setStyle] = useState<string>('storytelling');

  // Website scraping
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // AI generation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [adCopy, setAdCopy] = useState<{ hook: string; problem: string; solution: string; proof: string; cta: string } | null>(null);
  const [reelScript, setReelScript] = useState<{ hook: string; scenes: { timestamp: string; visual: string; audio: string; text: string }[] } | null>(null);

  /* ── Handlers ── */
  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => setHashtags(hashtags.filter(h => h !== tag));

  const toggleImage = (url: string) => {
    setSelectedImages(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
  };

  /* ── Scrape website ── */
  const handleScrape = useCallback(async () => {
    if (!scrapeUrl.trim()) { toast.error('Enter a URL to scrape'); return; }
    setScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      if (!res.ok) throw new Error('Scrape failed');
      const data = await res.json();
      setScrapedData(data);
      setAiTopic(data.title || data.description || '');
      if (data.ogImage) setSelectedImages([data.ogImage]);
      toast.success(`Found ${data.images.length} images from ${new URL(scrapeUrl).hostname}`);
    } catch {
      toast.error('Failed to scrape website. Check the URL and try again.');
    } finally {
      setScraping(false);
    }
  }, [scrapeUrl]);

  /* ── AI Generate ── */
  const handleAiGenerate = useCallback(async () => {
    if (!aiTopic.trim() && !scrapedData) {
      toast.error('Enter a topic or scrape a website first');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: (contentType === 'text_only' || contentType === 'single') ? 'post' : contentType,
          brand: {
            name: activeWorkspace?.name || 'Brand',
            voice: brandGuidelines?.tone_of_voice || '',
            industry: activeWorkspace?.industry || '',
            targetAudience: brandGuidelines?.writing_style || '',
          },
          product: scrapedData ? {
            name: scrapedData.title,
            description: scrapedData.description,
            images: selectedImages,
            url: scrapeUrl,
          } : { name: aiTopic, description: aiTopic },
          platform: selectedPlatforms[0] || 'instagram',
          goal,
          style,
          topic: aiTopic || scrapedData?.title || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Log non-sensitive error info for debugging
        throw new Error(err.error || `Generation failed (${res.status})`);
      }
      const data = await res.json();
      const result = data.content; // API wraps in { content: {...}, meta: {...} }

      // Apply result based on content type
      if (result.caption) setCaption(result.caption);
      if (result.hashtags) setHashtags(result.hashtags);
      if (result.slides) setCarouselSlides(result.slides);
      if (result.adCopy) setAdCopy(result.adCopy);
      if (result.scenes) setReelScript({ hook: result.hook || '', scenes: result.scenes });

      toast.success('Content generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI generation failed. Try again.');
    } finally {
      setAiLoading(false);
    }
  }, [contentType, activeWorkspace, brandGuidelines, scrapedData, selectedImages, scrapeUrl, selectedPlatforms, goal, style, aiTopic]);

  /* ── Save ── */
  const handleSave = async () => {
    if (!caption.trim()) { toast.error('Caption is required'); return; }
    try {
      await createPost.mutateAsync({
        caption: caption + (hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : ''),
        hashtags,
        contentType,
        targetPlatforms: selectedPlatforms,
        scheduledAt: scheduledAt || undefined,
      });
      toast.success(scheduledAt ? 'Post scheduled!' : 'Draft saved!');
      router.push('/posts');
    } catch {
      toast.error('Failed to save post');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Create Post</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'Select a workspace'}</p>
        </div>
      </div>

      {/* Step 1: Scrape or Topic */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-amber-600" />
          <label className="text-sm font-semibold text-zinc-900">Step 1: What are you promoting?</label>
        </div>
        <p className="text-xs text-zinc-500 mb-3">Paste a product URL to pull real images and data, or type a topic manually.</p>

        {/* URL Scraper */}
        <div className="flex gap-2 mb-3">
          <input
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            placeholder="https://example.com/products/your-product"
            className="flex-1 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Fetch
          </button>
        </div>

        {/* Scraped results */}
        {scrapedData && (
          <div className="mt-4 border border-zinc-100 rounded-lg p-4 bg-zinc-50/50">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-900">{scrapedData.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{scrapedData.description}</p>
              </div>
            </div>
            {scrapedData.images.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-600 mb-2">Select images to use ({selectedImages.length} selected)</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {scrapedData.images.slice(0, 12).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => toggleImage(img.url)}
                      className={cn(
                        'aspect-square rounded-lg overflow-hidden border-2 transition-all relative',
                        selectedImages.includes(img.url) ? 'border-amber-400 ring-2 ring-amber-200' : 'border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="w-full h-full object-cover" />
                      {selectedImages.includes(img.url) && (
                        <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-amber-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual topic */}
        <div className="mt-3">
          <input
            value={aiTopic}
            onChange={e => setAiTopic(e.target.value)}
            placeholder="Or type a topic: e.g. 'Spring collection launch' or 'New product announcement'"
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Editor (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <label className="block text-sm font-semibold text-zinc-900 mb-3">Step 2: Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-colors',
                      contentType === type.id ? 'border-amber-400 bg-amber-50' : 'border-zinc-200 hover:border-zinc-300'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 mb-1', contentType === type.id ? 'text-amber-600' : 'text-zinc-400')} />
                    <p className="text-sm font-medium text-zinc-900">{type.label}</p>
                    <p className="text-xs text-zinc-500">{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal & Style */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <label className="block text-sm font-semibold text-zinc-900 mb-3">Step 3: Goal & Style</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-zinc-600 mb-2">Campaign Goal</p>
                <div className="space-y-1.5">
                  {GOALS.map(g => {
                    const Icon = g.icon;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors',
                          goal === g.id ? 'border-amber-400 bg-amber-50 font-medium' : 'border-zinc-100 hover:border-zinc-200'
                        )}
                      >
                        <Icon className={cn('w-3.5 h-3.5', goal === g.id ? 'text-amber-600' : 'text-zinc-400')} />
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-600 mb-2">Content Style</p>
                <div className="space-y-1.5">
                  {STYLES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-left text-sm capitalize transition-colors',
                        style === s ? 'border-amber-400 bg-amber-50 font-medium' : 'border-zinc-100 hover:border-zinc-200'
                      )}
                    >
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Generate Button */}
          <button
            onClick={handleAiGenerate}
            disabled={aiLoading || (!aiTopic.trim() && !scrapedData)}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {aiLoading ? 'Generating commercial-grade content...' : 'Generate with AI Marketing Engine'}
          </button>

          {/* Caption */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <label className="text-sm font-semibold text-zinc-900 mb-3 block">Step 4: Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Your AI-generated caption will appear here, or write your own..."
              rows={8}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 resize-none"
            />
            <p className="text-xs text-zinc-400 mt-2">{caption.length} characters</p>
          </div>

          {/* Carousel Slides (if carousel type) */}
          {contentType === 'carousel' && carouselSlides.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <label className="text-sm font-semibold text-zinc-900 mb-3 block">Carousel Slides ({carouselSlides.length})</label>
              <div className="space-y-3">
                {carouselSlides.map((slide, i) => (
                  <div key={i} className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <input
                        value={slide.headline}
                        onChange={e => {
                          const updated = [...carouselSlides];
                          updated[i] = { ...updated[i], headline: e.target.value };
                          setCarouselSlides(updated);
                        }}
                        className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none"
                      />
                    </div>
                    <textarea
                      value={slide.body}
                      onChange={e => {
                        const updated = [...carouselSlides];
                        updated[i] = { ...updated[i], body: e.target.value };
                        setCarouselSlides(updated);
                      }}
                      rows={2}
                      className="w-full text-xs text-zinc-600 bg-transparent border-none focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ad Copy (if ad type) */}
          {contentType === 'ad' && adCopy && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <label className="text-sm font-semibold text-zinc-900 mb-3 block">Ad Copy Framework</label>
              <div className="space-y-3">
                {(['hook', 'problem', 'solution', 'proof', 'cta'] as const).map(key => (
                  <div key={key} className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-xs font-semibold text-amber-600 uppercase mb-1">{key}</p>
                    <textarea
                      value={adCopy[key]}
                      onChange={e => setAdCopy({ ...adCopy, [key]: e.target.value })}
                      rows={2}
                      className="w-full text-sm text-zinc-700 bg-transparent border-none focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reel Script (if reel type) */}
          {contentType === 'reel_script' && reelScript && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <label className="text-sm font-semibold text-zinc-900 mb-3 block">Reel Script</label>
              <div className="p-3 bg-amber-50 rounded-lg mb-3">
                <p className="text-xs font-semibold text-amber-700">HOOK</p>
                <p className="text-sm text-zinc-800">{reelScript.hook}</p>
              </div>
              <div className="space-y-2">
                {reelScript.scenes.map((scene, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded-lg grid grid-cols-4 gap-2 text-xs">
                    <div><span className="font-semibold text-zinc-500">Time:</span> {scene.timestamp}</div>
                    <div><span className="font-semibold text-zinc-500">Visual:</span> {scene.visual}</div>
                    <div><span className="font-semibold text-zinc-500">Audio:</span> {scene.audio}</div>
                    <div><span className="font-semibold text-zinc-500">Text:</span> {scene.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <label className="block text-sm font-medium text-zinc-700 mb-3">
              <Hash className="w-3.5 h-3.5 inline mr-1" />
              Hashtags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                  #{tag}
                  <button onClick={() => removeHashtag(tag)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                placeholder="Add a hashtag"
                className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
              <button onClick={addHashtag} className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm hover:bg-zinc-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Settings (1/3) */}
        <div className="space-y-6">
          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <label className="block text-sm font-medium text-zinc-700 mb-3">Selected Media</label>
              <div className="space-y-2">
                {selectedImages.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Selected ${i + 1}`} className="w-full aspect-square object-cover" />
                    <button
                      onClick={() => toggleImage(url)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platforms */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <label className="block text-sm font-medium text-zinc-700 mb-3">Platforms</label>
            <div className="space-y-1.5">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                      isSelected ? 'border-amber-400 bg-amber-50' : 'border-zinc-100 hover:border-zinc-200'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', platform.color)} />
                    <span className="text-sm text-zinc-900">{platform.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <label className="block text-sm font-medium text-zinc-700 mb-3">Schedule</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
            <p className="text-xs text-zinc-400 mt-2">Leave empty to save as draft</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              disabled={createPost.isPending}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {scheduledAt ? 'Schedule Post' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
