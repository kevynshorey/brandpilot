'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Copy,
  Check,
  Search,
  Instagram,
  Linkedin,
  Twitter,
  Pin,
  Megaphone,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Sparkles,
  Heart,
  Star,
  Zap,
  BookOpen,
  MessageSquare,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  category: string;
  platform: string[];
  icon: typeof Instagram;
  preview: string;
  hashtags: string[];
  tip: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'Promotional',
    platform: ['instagram', 'linkedin', 'twitter'],
    icon: Sparkles,
    preview: "🚀 Introducing [PRODUCT NAME] — the [ADJECTIVE] way to [BENEFIT].\n\nWe've been working on this for [TIME], and we can't wait for you to try it.\n\n✨ [Feature 1]\n✨ [Feature 2]\n✨ [Feature 3]\n\nAvailable now → Link in bio\n\n#NewLaunch #[Brand] #[Industry]",
    hashtags: ['#NewLaunch', '#JustDropped', '#NewProduct', '#ComingSoon'],
    tip: 'Post between 10am-2pm for maximum launch visibility',
  },
  {
    id: 'behind-scenes',
    name: 'Behind the Scenes',
    category: 'Engagement',
    platform: ['instagram', 'tiktok'],
    icon: Heart,
    preview: "A little peek behind the curtain 👀\n\n[Describe what's happening — be authentic and casual]\n\nThis is what [TIME OF DAY] looks like when you're building [PRODUCT/SERVICE].\n\nWould you want to see more of this? Drop a 🙌 below!\n\n#BTS #BehindTheScenes #[Industry]Life",
    hashtags: ['#BTS', '#BehindTheScenes', '#DayInTheLife', '#WorkLife'],
    tip: 'BTS content gets 3x more saves than polished content',
  },
  {
    id: 'educational-carousel',
    name: 'Educational Carousel',
    category: 'Educational',
    platform: ['instagram', 'linkedin'],
    icon: BookOpen,
    preview: "Slide 1: [HOOK QUESTION] — Here's what most people get wrong\n\nSlide 2: Mistake #1 → [Common mistake]\nSlide 3: Instead, try → [Better approach]\nSlide 4: Mistake #2 → [Common mistake]\nSlide 5: Instead, try → [Better approach]\nSlide 6: The key takeaway → [Main lesson]\nSlide 7: Save this for later ✨ Follow for more [TOPIC] tips\n\nCaption: Which of these mistakes have you made? I used to do #1 all the time 😅",
    hashtags: ['#Tips', '#DidYouKnow', '#LearnOn', '#ProTips'],
    tip: 'Carousels get 1.4x more reach than single images on Instagram',
  },
  {
    id: 'testimonial',
    name: 'Customer Testimonial',
    category: 'Social Proof',
    platform: ['instagram', 'linkedin', 'twitter'],
    icon: Star,
    preview: '"[CUSTOMER QUOTE about your product/service]"\n\n— [Customer Name], [Title/Location]\n\nStories like [NAME]\'s are why we do what we do. 💛\n\nWant results like this? [CTA — Link in bio / DM us / Book a call]\n\n#CustomerLove #Testimonial #[Industry]',
    hashtags: ['#CustomerLove', '#Testimonial', '#Results', '#HappyCustomer'],
    tip: 'Video testimonials convert 25% better than text',
  },
  {
    id: 'trending-hook',
    name: 'Trending Audio / Hook',
    category: 'Viral',
    platform: ['instagram', 'tiktok'],
    icon: TrendingUp,
    preview: "[Trending audio description]\n\n🎵 Using: [Audio name]\n\nPOV: You're a [YOUR NICHE] and you just [RELATABLE SITUATION]\n\nThe twist: [Unexpected/funny outcome]\n\nCaption: Tell me you're in [INDUSTRY] without telling me 😂\n\n#Trending #Relatable #[Niche]Humor",
    hashtags: ['#Trending', '#Viral', '#ForYouPage', '#Relatable'],
    tip: 'Jump on trends within 48 hours for maximum algorithm boost',
  },
  {
    id: 'sale-promo',
    name: 'Sale / Promotion',
    category: 'Promotional',
    platform: ['instagram', 'twitter', 'pinterest'],
    icon: ShoppingCart,
    preview: "🔥 [SALE NAME] is LIVE\n\n[DISCOUNT]% off everything — but only for [TIMEFRAME]\n\n🛒 What's included:\n→ [Product/Service 1]\n→ [Product/Service 2]\n→ [Product/Service 3]\n\n⏰ Ends [DATE] at midnight\n\nDon't sleep on this → Link in bio\n\n#Sale #[Brand]Sale #LimitedTime #Deal",
    hashtags: ['#Sale', '#LimitedTime', '#Deal', '#ShopNow'],
    tip: 'Create urgency with countdown stickers in Stories',
  },
  {
    id: 'linkedin-thought',
    name: 'LinkedIn Thought Leadership',
    category: 'Professional',
    platform: ['linkedin'],
    icon: Linkedin,
    preview: "I [DID SOMETHING UNCONVENTIONAL] and here's what happened:\n\n[Opening hook — surprising result or contrarian take]\n\nHere's the backstory:\n\n[2-3 short paragraphs telling the story]\n\nThe lesson?\n\n[Key takeaway in 1-2 sentences]\n\nAgree or disagree? I'd love to hear your perspective.\n\n♻️ Repost if this resonated",
    hashtags: ['#Leadership', '#CareerAdvice', '#Entrepreneurship'],
    tip: 'LinkedIn posts with 1,200-1,500 characters get the most engagement',
  },
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    category: 'Events',
    platform: ['instagram', 'linkedin', 'twitter'],
    icon: Calendar,
    preview: "📅 Mark your calendars!\n\n[EVENT NAME]\n🗓 [Date]\n⏰ [Time + Timezone]\n📍 [Location / Virtual link]\n\nWhat to expect:\n✅ [Highlight 1]\n✅ [Highlight 2]\n✅ [Highlight 3]\n\nSpots are limited — grab yours now 👇\n[Registration link]\n\n#Event #[EventName] #[Industry]Event",
    hashtags: ['#Event', '#SaveTheDate', '#Workshop', '#Webinar'],
    tip: 'Post event announcements 2-3 weeks out, with a reminder 24hrs before',
  },
  {
    id: 'user-generated',
    name: 'UGC / Repost',
    category: 'Community',
    platform: ['instagram', 'tiktok'],
    icon: Gift,
    preview: "We love seeing how you use [PRODUCT] 💛\n\n📸 by @[username]\n\n[1-2 sentences about why you love this customer's content]\n\nWant to be featured? Tag us in your posts using #[BrandHashtag]\n\n#UGC #Community #[Brand]Family #Repost",
    hashtags: ['#UGC', '#Community', '#Repost', '#CustomerSpotlight'],
    tip: 'UGC posts get 4x higher click-through rates than branded content',
  },
  {
    id: 'question-engagement',
    name: 'Question / Poll',
    category: 'Engagement',
    platform: ['instagram', 'twitter', 'linkedin'],
    icon: MessageSquare,
    preview: "[ENGAGING QUESTION related to your niche]?\n\nI'll go first: [Your answer]\n\nDrop yours below 👇\n\n(Wrong answers only 😂)\n\n#[Niche]Community #LetsTalk #Question",
    hashtags: ['#Question', '#LetsTalk', '#Community', '#Poll'],
    tip: 'Questions in captions boost comments by 50%+',
  },
  {
    id: 'mini-tutorial',
    name: 'Quick Tutorial / How-To',
    category: 'Educational',
    platform: ['instagram', 'tiktok', 'pinterest'],
    icon: Zap,
    preview: "How to [ACHIEVE RESULT] in [NUMBER] steps 👇\n\nStep 1: [Action] — [Brief explanation]\nStep 2: [Action] — [Brief explanation]\nStep 3: [Action] — [Brief explanation]\n\n💡 Pro tip: [Bonus insight]\n\nSave this for later! ✨\n\n#HowTo #Tutorial #[Topic]Tips #LearnSomethingNew",
    hashtags: ['#HowTo', '#Tutorial', '#Tips', '#LearnSomethingNew'],
    tip: 'Save-worthy content ranks higher in the algorithm',
  },
  {
    id: 'weekly-series',
    name: 'Weekly Series Post',
    category: 'Consistency',
    platform: ['instagram', 'linkedin', 'twitter'],
    icon: Calendar,
    preview: "[DAY]day [SERIES NAME] — Week [NUMBER] 🔁\n\nThis week's [topic/tip/feature/spotlight]:\n\n[Main content — keep it concise and valuable]\n\n💬 What would you like to see next week?\n\nCatch up on previous weeks → [Link/Highlight]\n\n#[SeriesName] #Weekly #[Day]Motivation",
    hashtags: ['#WeeklySeries', '#Consistency', '#ContentSeries'],
    tip: 'Consistent series build anticipation — pick a day and stick to it',
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
const PLATFORM_FILTERS = [
  { id: 'all', label: 'All', icon: Megaphone },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'X', icon: Twitter },
  { id: 'tiktok', label: 'TikTok', icon: TrendingUp },
  { id: 'pinterest', label: 'Pinterest', icon: Pin },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || t.category === category;
    const matchesPlatform = platformFilter === 'all' || t.platform.includes(platformFilter);
    return matchesSearch && matchesCat && matchesPlatform;
  });

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.preview);
    setCopiedId(template.id);
    toast.success('Template copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const useInCreate = (template: Template) => {
    // Store in sessionStorage for the create page to pick up
    sessionStorage.setItem('template_prefill', JSON.stringify({
      caption: template.preview,
      hashtags: template.hashtags,
    }));
    router.push('/create');
    toast.success('Template loaded into Create Post');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Content Templates</h1>
        <p className="text-zinc-500 mt-1">{TEMPLATES.length} ready-to-use templates — customize and post</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {PLATFORM_FILTERS.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPlatformFilter(p.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors',
                  platformFilter === p.id
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(template => {
          const Icon = template.icon;
          const isExpanded = expandedId === template.id;
          return (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900 text-sm">{template.name}</h3>
                      <p className="text-xs text-zinc-400">{template.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {template.platform.map(p => {
                      const PIcon = PLATFORM_FILTERS.find(pf => pf.id === p)?.icon || Megaphone;
                      return <PIcon key={p} className="w-3.5 h-3.5 text-zinc-300" />;
                    })}
                  </div>
                </div>

                <div
                  className={cn(
                    'text-xs text-zinc-600 whitespace-pre-line bg-zinc-50 rounded-lg p-3 font-mono leading-relaxed transition-all',
                    isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'
                  )}
                >
                  {template.preview}
                </div>
                {!isExpanded && template.preview.length > 200 && (
                  <button
                    onClick={() => setExpandedId(template.id)}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-1"
                  >
                    Show full template
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-1"
                  >
                    Collapse
                  </button>
                )}

                <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-3">
                  💡 {template.tip}
                </p>
              </div>

              <div className="flex border-t border-zinc-100">
                <button
                  onClick={() => copyTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  {copiedId === template.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === template.id ? 'Copied' : 'Copy'}
                </button>
                <div className="w-px bg-zinc-100" />
                <button
                  onClick={() => useInCreate(template)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-amber-600 hover:bg-amber-50 font-medium transition-colors"
                >
                  Use Template
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No templates match your filters</p>
        </div>
      )}
    </div>
  );
}
