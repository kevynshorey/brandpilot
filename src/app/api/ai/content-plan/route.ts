import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Rate limiting — 5 requests per minute per IP (AI-heavy endpoint)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------
function sanitize(text: string, maxLen = 2000): string {
  return text
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/\0/g, '')         // strip null bytes
    .replace(/ignore previous instructions/gi, '[filtered]') // basic prompt-injection guard
    .replace(/you are now/gi, '[filtered]')
    .slice(0, maxLen)
    .trim();
}

function sanitizeArray(arr: unknown, maxItems = 20, maxLen = 500): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v): v is string => typeof v === 'string')
    .slice(0, maxItems)
    .map((s) => sanitize(s, maxLen));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BrandInput {
  name: string;
  industry: string;
  targetAudience: string;
  voice: string;
}

interface ContentPlanRequest {
  brand: BrandInput;
  platforms: string[];
  postsPerWeek: number;
  goals: string[];
  competitors: string[];
  existingContent: string[];
}

// ---------------------------------------------------------------------------
// Industry-specific strategy presets
// ---------------------------------------------------------------------------
const INDUSTRY_STRATEGIES: Record<string, {
  pillars: string[];
  viralMechanics: string[];
  platformTips: string[];
  contentTypes: string[];
}> = {
  // Are You Vintage — vintage lifestyle/fashion magazine blog
  vintage: {
    pillars: ['Wheels (classic cars & motorcycles)', 'Threads (vintage fashion & style)', 'Spaces (retro interiors & architecture)', 'People (collectors, artisans, icons)', 'Culture (music, film, nostalgia)'],
    viralMechanics: ['before/after restorations', 'era comparisons (then vs now)', 'hidden gem spotlights', 'nostalgia triggers', '"guess the year" interactive posts', 'collector stories', 'controversial hot takes on modern vs vintage'],
    platformTips: ['Instagram Reels: restoration timelapses, thrift hauls, vintage lookbooks', 'Pinterest: SEO-rich boards for each pillar — vintage fashion, classic cars, retro decor', 'X/Twitter: hot takes on vintage culture, threads on iconic eras', 'TikTok: quick transformation reveals, "things that were better in the 80s"'],
    contentTypes: ['carousel', 'reel', 'story', 'blog-crosspost', 'pinterest-pin', 'thread'],
  },
  // Island Chem Solutions — industrial cleaning products in Barbados (B2B)
  'industrial-cleaning': {
    pillars: ['Product Education (how-tos, application guides)', 'Industry Authority (compliance, safety standards)', 'Case Studies (before/after client results)', 'Behind the Scenes (manufacturing, team, quality control)', 'Local Expertise (Caribbean-specific challenges — humidity, salt air, tropical conditions)'],
    viralMechanics: ['satisfying cleaning transformations', 'before/after reveals', 'myth-busting (common cleaning mistakes)', 'safety tip series', 'client testimonial spotlights', '"did you know" industry facts'],
    platformTips: ['LinkedIn: thought leadership articles, B2B case studies, industry compliance updates', 'Instagram: satisfying cleaning videos, product demos, team spotlights', 'Facebook: community engagement, local business partnerships, event coverage', 'YouTube Shorts: product demonstration clips, cleaning hacks'],
    contentTypes: ['carousel', 'video', 'article', 'infographic', 'testimonial', 'demo-reel'],
  },
  // Prime Barbados — luxury real estate & concierge
  'luxury-real-estate': {
    pillars: ['Property Showcases (luxury listings, virtual tours)', 'Island Lifestyle (Barbados living, relocation guides)', 'Investment Insights (market trends, ROI analysis)', 'Concierge & Experiences (dining, events, excursions)', 'Client Success Stories (testimonials, settlement journeys)'],
    viralMechanics: ['property reveal tours with dramatic hooks', 'lifestyle aspiration content', '"a day in Barbados" series', 'market hot takes', 'price comparison content (what $X gets you)', 'drone footage reveals', 'celebrity/notable home features'],
    platformTips: ['Instagram Reels: cinematic property tours, sunset lifestyle shots, drone reveals', 'LinkedIn: market analysis, investment thought leadership, relocation guides', 'Pinterest: aspirational boards — Barbados luxury homes, island interiors, tropical architecture', 'YouTube: full property walkthroughs, neighborhood guides, client interviews'],
    contentTypes: ['reel', 'carousel', 'story', 'video-tour', 'pinterest-pin', 'article', 'infographic'],
  },
  // LaunchPath — startup accelerator/venture platform
  'startup-accelerator': {
    pillars: ['Founder Spotlights (portfolio company stories)', 'Startup Education (fundraising, growth, product-market fit)', 'Industry Trends (emerging sectors, market analysis)', 'Behind the Program (demo days, mentorship, cohort updates)', 'Thought Leadership (venture insights, ecosystem building)'],
    viralMechanics: ['founder journey threads', 'startup failure lessons (controversial/honest)', 'fundraising hot takes', '"what I wish I knew" series', 'metric breakdowns', 'pitch deck teardowns', 'contrarian takes on startup advice'],
    platformTips: ['LinkedIn: primary channel — founder stories, fundraising insights, cohort announcements', 'X/Twitter: real-time takes, founder threads, ecosystem engagement', 'Instagram: behind-the-scenes of cohorts, demo day highlights, team culture', 'YouTube: founder interviews, pitch practice sessions, educational deep dives'],
    contentTypes: ['thread', 'carousel', 'article', 'video', 'newsletter-excerpt', 'infographic'],
  },
};

function detectIndustryStrategy(brand: BrandInput): typeof INDUSTRY_STRATEGIES[string] | null {
  const key = `${brand.name} ${brand.industry}`.toLowerCase();

  if (key.includes('vintage') || key.includes('are you vintage') || key.includes('retro') || key.includes('fashion magazine'))
    return INDUSTRY_STRATEGIES['vintage'];
  if (key.includes('chem') || key.includes('cleaning') || key.includes('industrial') || key.includes('island chem'))
    return INDUSTRY_STRATEGIES['industrial-cleaning'];
  if (key.includes('prime') || key.includes('real estate') || key.includes('luxury') || key.includes('concierge'))
    return INDUSTRY_STRATEGIES['luxury-real-estate'];
  if (key.includes('launch') || key.includes('accelerator') || key.includes('venture') || key.includes('startup'))
    return INDUSTRY_STRATEGIES['startup-accelerator'];

  return null;
}

// ---------------------------------------------------------------------------
// Build the system prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(brand: BrandInput, platforms: string[], industryStrategy: typeof INDUSTRY_STRATEGIES[string] | null): string {
  const industryContext = industryStrategy
    ? `
INDUSTRY-SPECIFIC GUIDANCE FOR THIS BRAND:
- Content Pillars: ${industryStrategy.pillars.join('; ')}
- Viral Mechanics That Work: ${industryStrategy.viralMechanics.join('; ')}
- Platform-Specific Tips: ${industryStrategy.platformTips.join('; ')}
- Recommended Content Types: ${industryStrategy.contentTypes.join(', ')}
`
    : '';

  return `You are an elite viral content strategist and social media growth expert. You create data-driven 30-day content calendars that maximize engagement, reach, and follower growth.

BRAND CONTEXT:
- Brand Name: ${brand.name}
- Industry: ${brand.industry}
- Target Audience: ${brand.targetAudience}
- Brand Voice: ${brand.voice}
- Active Platforms: ${platforms.join(', ')}
${industryContext}

YOUR EXPERTISE COVERS:
1. Platform Algorithms:
   - Instagram: Reels get 2x reach vs static; carousel saves boost ranking; first 3 seconds hook is critical
   - LinkedIn: text-only posts with line breaks outperform; thought leadership drives B2B; comment engagement within first hour is key
   - X/Twitter: threads with hooks get 3-5x engagement; controversy drives reach; timely trend-jacking multiplies impressions
   - Pinterest: SEO-rich descriptions; vertical pins (2:3 ratio); seasonal content 45 days early; keyword-rich board names
   - TikTok: first 1-2 seconds hook; trending sounds; duets and stitches for reach; educational content performs well
   - Facebook: groups and community posts; longer-form video; share-worthy content; local engagement

2. Content Strategy Framework (80/20 Rule):
   - 80% value content: educational, entertaining, inspiring, community-building
   - 20% promotional: product features, offers, CTAs, launches

3. Viral Mechanics:
   - Controversy / Hot Takes (opinion-driven engagement)
   - Relatability (shared experiences that drive comments)
   - Transformation / Before-After (visual proof of change)
   - Trend-Jacking (riding trending topics, sounds, formats)
   - Curiosity Gaps (hooks that demand the viewer keeps reading/watching)
   - Emotional Triggers (nostalgia, aspiration, surprise, humor)
   - Interactive Content (polls, quizzes, "this or that", challenges)

4. Posting Optimization:
   - Best times vary by platform and audience
   - Consistency > frequency
   - Content batching for efficiency

RESPONSE FORMAT: Return ONLY valid JSON matching the exact schema provided. No markdown, no explanation.`;
}

// ---------------------------------------------------------------------------
// Build the user prompt
// ---------------------------------------------------------------------------
function buildUserPrompt(req: ContentPlanRequest, startDate: string): string {
  return `Generate a 30-day viral content calendar starting from ${startDate}.

Configuration:
- Posts per week: ${req.postsPerWeek}
- Goals: ${req.goals.join(', ')}
- Competitors to outperform: ${req.competitors.length > 0 ? req.competitors.join(', ') : 'None specified'}
- Existing content to build on: ${req.existingContent.length > 0 ? req.existingContent.join(', ') : 'Starting fresh'}

Return valid JSON with this EXACT structure:
{
  "strategy": {
    "overview": "2-3 sentence strategic overview",
    "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4", "pillar5"],
    "viralHooks": ["hook template 1", "hook template 2", "hook template 3", "hook template 4", "hook template 5"]
  },
  "calendar": [
    {
      "day": 1,
      "date": "${startDate}",
      "posts": [
        {
          "platform": "instagram",
          "contentType": "carousel",
          "pillar": "education",
          "topic": "descriptive topic",
          "hookLine": "attention-grabbing first line",
          "brief": "2-3 sentence content brief with key points to cover",
          "bestTime": "10:00 AM",
          "expectedEngagement": "high",
          "viralPotential": 8,
          "trendToLeverage": "relevant trend or format to use"
        }
      ]
    }
  ],
  "weeklyThemes": [
    { "week": 1, "theme": "theme name", "focus": "what to emphasize this week" },
    { "week": 2, "theme": "theme name", "focus": "what to emphasize this week" },
    { "week": 3, "theme": "theme name", "focus": "what to emphasize this week" },
    { "week": 4, "theme": "theme name", "focus": "what to emphasize this week" },
    { "week": 5, "theme": "theme name", "focus": "final days focus" }
  ],
  "kpis": {
    "targetFollowerGrowth": "percentage or number",
    "targetEngagementRate": "percentage",
    "targetReach": "number or range"
  }
}

Rules:
- Distribute ${req.postsPerWeek} posts per week evenly across the 7 days
- Rotate across all specified platforms: ${req.platforms.join(', ')}
- Rotate across content pillars — no pillar should dominate
- Days without posts should have an empty "posts" array
- Follow the 80/20 rule: 80% value content, 20% promotional
- viralPotential is a score from 1-10
- expectedEngagement is "high" or "medium"
- Include trend-jacking opportunities where relevant
- Tailor content types to each platform's strengths
- Make hook lines genuinely attention-grabbing — no generic filler
- Each day must have a unique date incrementing from ${startDate}`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    // ----- Parse & validate body -----
    const body = await request.json();

    const { brand, platforms, postsPerWeek, goals, competitors, existingContent } = body as ContentPlanRequest;

    // Required fields
    if (!brand || typeof brand !== 'object') {
      return NextResponse.json({ error: 'brand object is required' }, { status: 400 });
    }
    if (!brand.name || typeof brand.name !== 'string') {
      return NextResponse.json({ error: 'brand.name is required' }, { status: 400 });
    }
    if (!brand.industry || typeof brand.industry !== 'string') {
      return NextResponse.json({ error: 'brand.industry is required' }, { status: 400 });
    }
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'platforms array is required and must not be empty' }, { status: 400 });
    }

    // Sanitize all inputs
    const cleanBrand: BrandInput = {
      name: sanitize(brand.name, 200),
      industry: sanitize(brand.industry, 200),
      targetAudience: sanitize(brand.targetAudience || '', 500),
      voice: sanitize(brand.voice || '', 500),
    };

    const allowedPlatforms = ['instagram', 'linkedin', 'x', 'twitter', 'pinterest', 'tiktok', 'facebook', 'youtube'];
    const cleanPlatforms = sanitizeArray(platforms, 8, 50).filter((p) =>
      allowedPlatforms.includes(p.toLowerCase()),
    );
    if (cleanPlatforms.length === 0) {
      return NextResponse.json(
        { error: `Invalid platforms. Allowed: ${allowedPlatforms.join(', ')}` },
        { status: 400 },
      );
    }

    const cleanPostsPerWeek = Math.min(Math.max(Number(postsPerWeek) || 5, 1), 28);
    const cleanGoals = sanitizeArray(goals, 10, 300);
    const cleanCompetitors = sanitizeArray(competitors, 10, 200);
    const cleanExistingContent = sanitizeArray(existingContent, 20, 300);

    // ----- Build prompts -----
    const startDate = getNextDate();
    const industryStrategy = detectIndustryStrategy(cleanBrand);

    const systemPrompt = buildSystemPrompt(cleanBrand, cleanPlatforms, industryStrategy);
    const userPrompt = buildUserPrompt(
      {
        brand: cleanBrand,
        platforms: cleanPlatforms,
        postsPerWeek: cleanPostsPerWeek,
        goals: cleanGoals,
        competitors: cleanCompetitors,
        existingContent: cleanExistingContent,
      },
      startDate,
    );

    // ----- Call OpenAI -----
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 16000,
        temperature: 0.9,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI content-plan error:', errText);
      return NextResponse.json({ error: 'Content plan generation failed' }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
    }

    const plan = JSON.parse(content);

    // ----- Validate response shape -----
    if (!plan.strategy || !plan.calendar || !Array.isArray(plan.calendar)) {
      return NextResponse.json({ error: 'AI returned malformed content plan' }, { status: 502 });
    }

    return NextResponse.json({
      ...plan,
      meta: {
        brand: cleanBrand.name,
        platforms: cleanPlatforms,
        postsPerWeek: cleanPostsPerWeek,
        generatedAt: new Date().toISOString(),
        startDate,
        model: 'gpt-4o',
      },
    });
  } catch (err) {
    console.error('Content plan error:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Content plan generation failed' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns tomorrow's date as YYYY-MM-DD */
function getNextDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
