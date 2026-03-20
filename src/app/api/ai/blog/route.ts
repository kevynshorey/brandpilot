import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { scrapeArticle, type ScrapedArticle } from '@/lib/scraper';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(5, 60_000);

function sanitize(text: string, maxLen = 2000): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\0/g, '')
    .replace(/ignore previous instructions/gi, '[filtered]')
    .replace(/disregard (?:all |any )?(?:prior |previous )?instructions/gi, '[filtered]')
    .slice(0, maxLen)
    .trim();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 5 requests per minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'research_urls') {
      return await researchUrls(body);
    } else if (action === 'generate_blog') {
      return await generateBlog(body);
    } else if (action === 'generate_ig_preview') {
      return await generateIgPreview(body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Blog API error:', err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Blog generation failed' }, { status: 500 });
  }
}

// --- Action: research_urls ---
async function researchUrls(body: Record<string, unknown>) {
  const urls = body.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
  }
  if (urls.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 URLs per request' }, { status: 400 });
  }

  const articles: ScrapedArticle[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const url of urls) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      errors.push({ url: String(url), error: 'Invalid URL' });
      continue;
    }
    try {
      const article = await scrapeArticle(sanitize(url, 2048));
      articles.push(article);
    } catch (err) {
      errors.push({ url, error: err instanceof Error ? err.message : 'Scrape failed' });
    }
  }

  return NextResponse.json({ articles, errors });
}

// --- Action: generate_blog (Claude) ---
async function generateBlog(body: Record<string, unknown>) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
  }

  const topic = sanitize(String(body.topic || ''), 500);
  const sourceContent = sanitize(String(body.sourceContent || ''), 8000);
  const brandName = sanitize(String(body.brandName || ''), 200);
  const brandVoice = sanitize(String(body.brandVoice || ''), 1000);
  const industry = sanitize(String(body.industry || ''), 200);
  const keywords = sanitize(String(body.keywords || ''), 500);
  const length = body.length === 'short' ? 'short' : body.length === 'long' ? 'long' : 'medium';

  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }

  const wordCount = length === 'short' ? '400-600' : length === 'long' ? '1200-1800' : '700-1000';

  const systemPrompt = `You are a senior content strategist and viral blog writer for ${brandName || 'a premium lifestyle brand'}. You create highly shareable, SEO-optimized blog posts that drive massive traffic and build authority.

BRAND CONTEXT:
- Brand: ${brandName || 'Not specified'}
- Voice: ${brandVoice || 'Authentic, opinionated, culturally aware'}
- Industry: ${industry || 'Lifestyle / Culture'}

${sourceContent ? `SOURCE MATERIAL:
You have been given existing articles on this topic. Your job is to:
1. Extract the most compelling insights, data points, and angles
2. Rewrite everything in the brand's unique voice and perspective
3. Add original analysis, hot takes, and cultural commentary
4. Make it BETTER than the sources — more engaging, more shareable, more valuable
5. Never copy sentences verbatim — always transform and elevate

Do NOT just summarize. Create something that stands on its own as original, valuable content.` : ''}

WRITING RULES:
1. Write in the brand's voice — no generic AI patterns
2. Hook readers in the FIRST SENTENCE with a bold claim, provocative question, or surprising fact
3. Use short paragraphs (2-3 sentences max)
4. Include subheadings (H2) every 2-3 paragraphs
5. Weave in keywords naturally — no keyword stuffing
6. End with a clear CTA
7. BANNED phrases: "In today's world", "Let's dive in", "It's no secret", "Game-changer", "Unlock", "Ah,", "Here's the thing"
8. Write at a conversational, accessible level — like talking to a friend who's interested
9. Include actionable takeaways readers can use immediately
10. Make it the kind of post people screenshot and share on their stories

Return ONLY valid JSON:
{
  "title": "Blog post title (SEO-optimized, curiosity-driven, viral potential)",
  "slug": "url-friendly-slug",
  "metaDescription": "155 character SEO meta description",
  "content": "Full blog post in markdown format with ## headings, **bold**, and paragraph breaks",
  "excerpt": "2-3 sentence teaser for social sharing that creates an open loop",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const userPrompt = `Write a ${wordCount} word blog post about: ${topic}

${keywords ? `Target keywords: ${keywords}` : ''}

${sourceContent ? `SOURCE ARTICLES TO DRAW FROM:\n${sourceContent}` : ''}

Make it genuinely viral-worthy — the kind of post that gets 10K shares, bookmarked by everyone in the niche, and referenced in other articles. Not fluff. Not filler. Pure value with personality.`;

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4000,
    temperature: 0.8,
    messages: [
      { role: 'user', content: userPrompt },
    ],
    system: systemPrompt,
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'Empty response from Claude' }, { status: 502 });
  }

  // Parse JSON from Claude's response (may be wrapped in markdown code blocks)
  let rawJson = textBlock.text.trim();
  if (rawJson.startsWith('```')) {
    rawJson = rawJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let result;
  try {
    result = JSON.parse(rawJson);
  } catch {
    console.error('[ai/blog] Failed to parse Claude response as JSON');
    return NextResponse.json({ error: 'AI returned malformed response' }, { status: 502 });
  }

  // Log to ai_generations (best-effort, don't fail the request)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const workspaceId = body.workspaceId as string;
      if (workspaceId) {
        await supabase.from('ai_generations').insert({
          workspace_id: workspaceId,
          user_id: user.id,
          generation_type: 'blog',
          prompt: topic,
          result: rawJson,
          model: 'claude-sonnet-4-5-20250514',
          tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        });
      }
    }
  } catch (logErr) {
    console.error('Failed to log ai_generation:', logErr);
  }

  return NextResponse.json({ blog: result, model: 'claude-sonnet-4-5-20250514' });
}

// --- Action: generate_ig_preview (OpenAI, unchanged logic) ---
async function generateIgPreview(body: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const blogTitle = sanitize(String(body.blogTitle || ''), 300);
  const blogExcerpt = sanitize(String(body.blogExcerpt || ''), 500);
  const blogContent = sanitize(String(body.blogContent || ''), 2000);
  const brandName = sanitize(String(body.brandName || ''), 200);
  const brandVoice = sanitize(String(body.brandVoice || ''), 1000);

  if (!blogTitle) {
    return NextResponse.json({ error: 'Blog title is required' }, { status: 400 });
  }

  const systemPrompt = `You are a social media expert creating an Instagram post to promote a blog article for ${brandName || 'a brand'}.

BRAND VOICE: ${brandVoice || 'Professional and engaging'}

Create an Instagram post that teases the blog content and drives clicks to read the full article. The post should:
1. Hook with the most compelling insight from the blog
2. Give 2-3 key takeaways (enough value to engage, not enough to skip the blog)
3. End with a CTA to read the full post (link in bio)
4. Include strategic hashtags

Return ONLY valid JSON:
{
  "caption": "Full Instagram caption with line breaks as \\n",
  "hashtags": ["tag1", "tag2"],
  "hookLine": "The scroll-stopping first line",
  "cardText": "Short text overlay for the preview card image (max 15 words)",
  "cardSubtext": "Subtitle for the card (max 10 words)"
}`;

  const userPrompt = `Create an Instagram post promoting this blog:

TITLE: ${blogTitle}
EXCERPT: ${blogExcerpt}
KEY CONTENT: ${blogContent.slice(0, 1000)}

Make the Instagram post irresistible — people should NEED to read the full blog after seeing this.`;

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
      max_tokens: 1000,
      temperature: 0.82,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OpenAI IG preview error:', errText);
    return NextResponse.json({ error: 'IG preview generation failed' }, { status: 502 });
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
  }

  let igResult;
  try {
    igResult = JSON.parse(rawContent);
  } catch {
    console.error('[ai/blog] Failed to parse IG preview response as JSON');
    return NextResponse.json({ error: 'AI returned malformed IG preview' }, { status: 502 });
  }
  return NextResponse.json({ igPreview: igResult, model: 'gpt-4o' });
}
