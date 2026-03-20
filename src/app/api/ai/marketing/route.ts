import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per-IP, sliding window)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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
    .replace(/<[^>]*>/g, '')
    .replace(/\0/g, '')
    .replace(/ignore previous instructions/gi, '[filtered]')
    .replace(/disregard (?:all |any )?(?:prior |previous )?instructions/gi, '[filtered]')
    .slice(0, maxLen)
    .trim();
}

function sanitizeObj(
  obj: Record<string, unknown>,
  fields: Record<string, number>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, maxLen] of Object.entries(fields)) {
    const val = obj?.[key];
    out[key] = typeof val === 'string' ? sanitize(val, maxLen) : '';
  }
  return out;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ContentType = 'post' | 'carousel' | 'ad' | 'story' | 'reel_script' | 'blog_promo';
type Platform = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'pinterest' | 'tiktok';
type Goal = 'awareness' | 'engagement' | 'conversion' | 'traffic';
type Style = 'educational' | 'storytelling' | 'promotional' | 'behind_the_scenes' | 'user_generated' | 'controversial';

const VALID_CONTENT_TYPES: ContentType[] = ['post', 'carousel', 'ad', 'story', 'reel_script', 'blog_promo'];
const VALID_PLATFORMS: Platform[] = ['instagram', 'linkedin', 'twitter', 'facebook', 'pinterest', 'tiktok'];
const VALID_GOALS: Goal[] = ['awareness', 'engagement', 'conversion', 'traffic'];
const VALID_STYLES: Style[] = ['educational', 'storytelling', 'promotional', 'behind_the_scenes', 'user_generated', 'controversial'];

// ---------------------------------------------------------------------------
// Platform-specific intelligence
// ---------------------------------------------------------------------------
const PLATFORM_SPECS: Record<Platform, string> = {
  instagram: `Instagram rules:
- Caption max 2,200 chars; first 125 chars visible before "more"
- 20-30 hashtags in a comment block, mix of high-volume (500K+), mid (50K-500K), and niche (<50K)
- Best times: Tue/Wed/Thu 10am-1pm, Sun 7-9pm (audience local time)
- Reels get 2x reach vs static posts; carousel saves drive algorithm boost
- Use line breaks and emojis strategically for readability
- Hook must land in the first line before the fold`,

  linkedin: `LinkedIn rules:
- Post max 3,000 chars; first 210 chars show before "see more"
- 3-5 hashtags only, industry-specific, no hashtag walls
- Best times: Tue-Thu 7-8am, 12pm, 5-6pm
- Personal stories outperform corporate speak 3:1
- Use "I" not "we" - first person gets 2x engagement
- Document carousels (PDF) get 2.2x more reach than text-only
- Line breaks every 1-2 sentences; no walls of text`,

  twitter: `X/Twitter rules:
- 280 char limit; tweets under 100 chars get 17% more engagement
- 1-2 hashtags max; more than 2 drops engagement by 17%
- Best times: Mon-Fri 8am-10am, 6pm-9pm
- Thread format for longer content; number each tweet
- Questions get 2x more replies
- Quote tweets with added insight outperform plain retweets`,

  facebook: `Facebook rules:
- Optimal post length 40-80 chars; under 250 chars get 60% more engagement
- 1-3 hashtags max, often none
- Best times: Wed 11am-1pm, Thu-Fri 1-4pm
- Questions and fill-in-the-blank posts drive comments
- Video gets 135% more organic reach than images
- Tag relevant pages when genuine; don't tag-spam`,

  pinterest: `Pinterest rules:
- Pin title max 100 chars; description max 500 chars
- Use 2-5 relevant keyword hashtags in description
- Best times: Sat 8-11pm, Fri 3pm
- Vertical 2:3 ratio images (1000x1500px) perform best
- Include keywords naturally in first 50 chars of description
- Rich Pins with pricing convert 36% higher
- Seasonal content should be pinned 30-45 days early`,

  tiktok: `TikTok rules:
- Caption max 2,200 chars; but shorter is better
- 3-5 hashtags mixing trending + niche
- Best times: Tue 9am, Thu 12pm, Fri 5am
- First 1-3 seconds determine if viewer stays
- Pattern interrupts every 3-5 seconds keep watch time
- Reply to comments with video for algorithmic boost
- Use trending sounds; original audio for brand series`,
};

// ---------------------------------------------------------------------------
// Goal-specific strategy
// ---------------------------------------------------------------------------
const GOAL_STRATEGY: Record<Goal, string> = {
  awareness: `GOAL: BRAND AWARENESS
- Optimize for shares and saves (algorithm fuel)
- Lead with a bold, contrarian, or curiosity-driven hook
- Prioritize reach signals: trending hashtags, shareable formats, relatable content
- CTA: "Share this with someone who needs to hear it" / "Save for later"
- Avoid hard sells; build know-like-trust
- Use the "This vs That" or "Myth vs Reality" framework for maximum shares`,

  engagement: `GOAL: ENGAGEMENT (comments, saves, shares)
- Ask polarizing (but brand-safe) questions
- Use "hot take" framing: "Unpopular opinion: ..."
- Create micro-controversies that invite debate
- CTA: Ask a specific question that's easy to answer in comments
- Use "This or That" polls, "Rate 1-10", "Fill in the blank ___"
- Engagement bait that's genuine, not manipulative`,

  conversion: `GOAL: CONVERSION (sales, sign-ups, bookings)
- Lead with the transformation, not the product
- Use PAS (Problem-Agitate-Solve) or AIDA (Attention-Interest-Desire-Action)
- Include urgency triggers: limited time, limited quantity, exclusive access
- Specific social proof: "1,247 customers" not "thousands"
- CTA: Single, clear, friction-free action with URL
- Price anchor if applicable: show value vs. cost
- Handle the #1 objection in the copy`,

  traffic: `GOAL: DRIVE TRAFFIC (link clicks)
- Create an open loop: give 80% of the value, close the loop at the link
- Use "listicle tease": "7 ways to X (number 4 changed everything)"
- CTA: Explain exactly what they'll get when they click
- Platform-specific link placement (bio link, swipe up, comment pinning)
- Preview the destination content to build click-through confidence
- Avoid "link in bio" — instead say what they'll find there`,
};

// ---------------------------------------------------------------------------
// Style-specific voice
// ---------------------------------------------------------------------------
const STYLE_DIRECTION: Record<Style, string> = {
  educational: `STYLE: EDUCATIONAL / VALUE-FIRST
- Lead with a surprising statistic, counter-intuitive fact, or "Did you know?"
- Use numbered lists and step-by-step frameworks
- Position the brand as the knowledgeable authority
- Ratio: 90% value, 10% brand mention
- End with "Want more? [CTA]"
- Format: problem → insight → actionable takeaway`,

  storytelling: `STYLE: STORYTELLING / NARRATIVE
- Open with a scene, not a statement: time, place, emotion
- Use the "Before → Moment of Truth → After" arc
- Write in short, punchy sentences. One idea per line.
- Include sensory details (what you saw, heard, felt)
- The product/brand enters as the natural turning point
- End with the moral or lesson that ties back to the audience's life`,

  promotional: `STYLE: PROMOTIONAL / DIRECT RESPONSE
- Lead with the strongest benefit, not the feature
- Use the BAB (Before-After-Bridge) framework
- Feature → Benefit → Proof → CTA
- Social proof within the first 2 sentences
- Create FOMO with specifics (exact numbers, deadlines, limited availability)
- Strong CTA with urgency modifier: "Shop now — only 12 left at this price"`,

  behind_the_scenes: `STYLE: BEHIND THE SCENES / AUTHENTIC
- Use casual, conversational tone — like texting a friend
- Show the messy, real, unfiltered process
- "Here's what they don't show you about..."
- Include a genuine lesson learned or mistake made
- Humanize the brand: name real people, show real spaces
- No corporate speak; contractions, incomplete sentences are OK`,

  user_generated: `STYLE: UGC / SOCIAL PROOF
- Write as if a real customer is sharing their experience
- Use first-person: "I just tried..." / "OK so I have to talk about..."
- Include specific, relatable details (not generic praise)
- Natural language with mild imperfections (feels real, not scripted)
- The "recommendation to a friend" tone
- Mention a specific before/after or use-case scenario`,

  controversial: `STYLE: CONTROVERSIAL / HOT TAKE
- Open with a bold, opinion-driven statement that challenges the norm
- "Unpopular opinion:" / "Hot take:" / "I'll say it:"
- Take a clear side — wishy-washy doesn't get engagement
- Support with 1-2 quick proof points
- Invite disagreement: "Change my mind" / "Fight me in the comments"
- Stay brand-safe: controversial on topic, not on values`,
};

// ---------------------------------------------------------------------------
// Response format schemas (injected into the prompt per content type)
// ---------------------------------------------------------------------------
const RESPONSE_SCHEMAS: Record<ContentType, string> = {
  post: `Return ONLY valid JSON with this exact structure:
{
  "caption": "Full post caption with line breaks as \\n",
  "hashtags": ["tag1", "tag2", ...],
  "callToAction": "The specific CTA text",
  "bestPostTime": "Recommended posting time with reasoning",
  "hookLine": "The opening hook line that stops the scroll"
}`,

  carousel: `Return ONLY valid JSON with this exact structure:
{
  "slides": [
    { "headline": "Slide headline (5-8 words max)", "body": "Slide body text (15-25 words)", "imagePrompt": "Detailed visual description for this slide" }
  ],
  "caption": "Full carousel caption for the feed",
  "hashtags": ["tag1", "tag2", ...]
}
Generate 7-10 slides. Slide 1 = attention-grabbing hook. Last slide = strong CTA. Middle slides = value delivery with a logical flow.`,

  ad: `Return ONLY valid JSON with this exact structure:
{
  "primaryText": "The main ad copy shown above the creative (125 chars for FB/IG)",
  "headline": "Bold headline shown on the creative (40 chars max)",
  "description": "Supporting description below headline (30 chars max)",
  "callToAction": "CTA button text (e.g. Shop Now, Learn More, Sign Up)",
  "targetingTips": "Audience targeting recommendations",
  "adCopy": {
    "hook": "The attention-grabbing first line",
    "problem": "The pain point or problem statement",
    "solution": "How the product/brand solves it",
    "proof": "Social proof or credibility element",
    "cta": "Final call to action with urgency"
  }
}`,

  story: `Return ONLY valid JSON with this exact structure:
{
  "frames": [
    { "text": "Text overlay for this frame", "visual": "Visual description / background", "sticker": "Suggested interactive sticker (poll, quiz, slider, question, countdown)" }
  ],
  "caption": "Caption if shared to feed",
  "hashtags": ["tag1", "tag2", ...]
}
Generate 4-7 story frames. Use interactive stickers on at least 2 frames for engagement.`,

  reel_script: `Return ONLY valid JSON with this exact structure:
{
  "hook": "First 1-3 seconds hook text (what they see/hear immediately)",
  "scenes": [
    { "timestamp": "0:00-0:03", "visual": "What's on screen", "audio": "Voiceover or sound", "text": "Text overlay" }
  ],
  "caption": "Full reel caption",
  "hashtags": ["tag1", "tag2", ...],
  "audioSuggestion": "Trending audio or original audio recommendation"
}
Script should be 15-60 seconds. Include pattern interrupts every 3-5 seconds. The hook must land in the first 1.5 seconds.`,

  blog_promo: `Return ONLY valid JSON with this exact structure:
{
  "title": "Blog-style headline (curiosity-driven, SEO-friendly)",
  "excerpt": "2-3 sentence teaser that creates an open loop",
  "caption": "Social media caption promoting the blog post",
  "hashtags": ["tag1", "tag2", ...],
  "pullQuotes": ["Shareable quote 1 from the content", "Shareable quote 2", "Shareable quote 3"]
}
Pull quotes should be standalone statements that work as social media quotes or tweet-sized insights.`,
};

// ---------------------------------------------------------------------------
// Master system prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(
  contentType: ContentType,
  platform: Platform,
  goal: Goal,
  style: Style,
): string {
  return `You are a senior marketing director and direct-response copywriter at a top-tier creative agency. You have 15 years of experience creating high-converting social media content for premium brands. Your work consistently outperforms industry benchmarks by 3-5x.

YOUR EXPERTISE:
- Direct response copywriting frameworks: AIDA (Attention-Interest-Desire-Action), PAS (Problem-Agitate-Solve), BAB (Before-After-Bridge), and the 4 Ps (Promise-Picture-Proof-Push)
- Scroll-stopping hook patterns: curiosity gaps, bold claims, pattern interrupts, "I" statements, contrarian takes, specific numbers
- Platform algorithm optimization: what each platform rewards with reach
- Conversion psychology: urgency, scarcity, social proof, authority, reciprocity, loss aversion
- Brand voice calibration: adapting frameworks to any brand tone without losing effectiveness

YOUR RULES:
1. Every piece of content starts with a HOOK that stops the scroll within 1.5 seconds of reading
2. Never use generic phrases: "In today's world", "Are you looking for", "Unlock your potential", "Level up your game", "It's no secret that"
3. Never use corporate jargon unless the brand voice specifically calls for it
4. Write at a 6th-8th grade reading level — short sentences, simple words, powerful impact
5. Every CTA must be specific and friction-free — tell them exactly what to do and what they'll get
6. Use concrete numbers over vague claims: "247% increase" not "huge growth"
7. Hashtags must be a strategic mix: 40% high-volume, 40% mid-range, 20% niche/branded
8. Content must feel native to the platform — not repurposed across channels
9. Avoid AI-sounding patterns: no "Ah,", no "Let's dive in", no "Here's the thing", no "Game-changer"
10. Write like a human who's genuinely excited about the product, not a bot running a template

${PLATFORM_SPECS[platform]}

${GOAL_STRATEGY[goal]}

${STYLE_DIRECTION[style]}

CONTENT TYPE: ${contentType.toUpperCase()}
${RESPONSE_SCHEMAS[contentType]}

Respond with ONLY the JSON object. No markdown, no code blocks, no explanations.`;
}

// ---------------------------------------------------------------------------
// Build user prompt
// ---------------------------------------------------------------------------
function buildUserPrompt(
  contentType: ContentType,
  brand: Record<string, string>,
  product: Record<string, string>,
  productImages: string[],
  platform: Platform,
  goal: Goal,
): string {
  const imageContext = productImages.length > 0
    ? `\nProduct images available: ${productImages.length} image(s). Reference these in visual descriptions where appropriate.`
    : '';

  return `Create a ${contentType.replace('_', ' ')} for ${platform}.

BRAND PROFILE:
- Brand: ${brand.name || 'Not specified'}
- Voice & Tone: ${brand.voice || 'Professional yet approachable'}
- Industry: ${brand.industry || 'Not specified'}
- Target Audience: ${brand.targetAudience || 'General consumers'}

PRODUCT/SERVICE:
- Name: ${product.name || 'Not specified'}
- Description: ${product.description || 'Not specified'}
- Price: ${product.price || 'Not specified'}
- URL: ${product.url || 'Not specified'}${imageContext}

CAMPAIGN GOAL: ${goal}

Generate the content now. Make it sound like it was crafted by a $10K/month agency, not like generic AI output. Every word must earn its place.`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 requests per minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    console.log('Marketing API request:', { contentType: body.contentType, platform: body.platform, goal: body.goal, style: body.style, brandName: body.brand?.name });

    // --- Validate enums ---------------------------------------------------
    const contentType = body.contentType as ContentType;
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const platform = body.platform as Platform;
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 },
      );
    }

    const goal = (body.goal as Goal) || 'engagement';
    if (!VALID_GOALS.includes(goal)) {
      return NextResponse.json(
        { error: `Invalid goal. Must be one of: ${VALID_GOALS.join(', ')}` },
        { status: 400 },
      );
    }

    const style = (body.style as Style) || 'promotional';
    if (!VALID_STYLES.includes(style)) {
      return NextResponse.json(
        { error: `Invalid style. Must be one of: ${VALID_STYLES.join(', ')}` },
        { status: 400 },
      );
    }

    // --- Sanitize nested objects ------------------------------------------
    const brand = sanitizeObj(body.brand ?? {}, {
      name: 200,
      voice: 500,
      industry: 200,
      targetAudience: 500,
    });

    const product = sanitizeObj(body.product ?? {}, {
      name: 200,
      description: 1000,
      price: 50,
      url: 500,
    });

    // Validate product URL scheme
    if (product.url && !/^https?:\/\//i.test(product.url) && product.url.length > 0) {
      product.url = '';
    }

    // Sanitize image URLs array
    const productImages: string[] = [];
    if (Array.isArray(body.product?.images)) {
      for (const img of body.product.images.slice(0, 10)) {
        if (typeof img === 'string' && /^https?:\/\//i.test(img)) {
          productImages.push(sanitize(img, 500));
        }
      }
    }

    // --- Validate required fields ----------------------------------------
    if (!brand.name) {
      return NextResponse.json(
        { error: 'brand.name is required' },
        { status: 400 },
      );
    }

    // --- Build prompts ---------------------------------------------------
    const systemPrompt = buildSystemPrompt(contentType, platform, goal, style);
    const userPrompt = buildUserPrompt(contentType, brand, product, productImages, platform, goal);

    // --- Call OpenAI -----------------------------------------------------
    const maxTokens = contentType === 'carousel' || contentType === 'reel_script' ? 2000 : 1200;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.82,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI marketing generation error:', errText);
      return NextResponse.json(
        { error: 'Content generation failed' },
        { status: 502 },
      );
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 502 },
      );
    }

    const result = JSON.parse(rawContent);

    return NextResponse.json({
      content: result,
      meta: {
        contentType,
        platform,
        goal,
        style,
        brand: brand.name,
        model: 'gpt-4o',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Marketing content generation error:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 },
    );
  }
}
