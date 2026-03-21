import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(10, 60_000, 'ai-repurpose');

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------
function sanitize(text: string, maxLen = 3000): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\0/g, '')
    .replace(/ignore previous instructions/gi, '[filtered]')
    .replace(/disregard (?:all |any )?(?:prior |previous )?instructions/gi, '[filtered]')
    .slice(0, maxLen)
    .trim();
}

// ---------------------------------------------------------------------------
// Platform adaptation rules
// ---------------------------------------------------------------------------
const PLATFORM_RULES: Record<string, string> = {
  instagram: `Instagram: Max 2,200 chars. Hook in first 125 chars (before fold). Use emojis + line breaks. Add 15-25 relevant hashtags as a block at the end. Conversational, visual language. Include a CTA.`,
  linkedin: `LinkedIn: Max 3,000 chars. Hook in first 210 chars. Professional but human tone. 3-5 hashtags only. Use line breaks for readability. Add a thought-provoking question at the end. No emojis unless tasteful.`,
  twitter: `X/Twitter: Max 280 chars. Punchy, direct, quotable. 1-3 hashtags max. No emoji walls. Use a hook that stops the scroll. Thread if complex (indicate with 🧵). Contrarian angles work.`,
  facebook: `Facebook: 1-2 paragraphs. Conversational, story-driven. Ask a question to drive comments. 2-5 hashtags. Shareable content > performative content. Link in comments, not in post.`,
  pinterest: `Pinterest: SEO-rich description 100-500 chars. Use keywords naturally. Include a clear CTA. No hashtags (Pinterest uses keyword search). Describe the value/outcome of clicking.`,
  tiktok: `TikTok: Short, punchy caption under 150 chars. 3-5 trending hashtags. Use a hook format: "POV:", "Wait for it", "Nobody talks about this". Reference the video content directly.`,
};

const ALL_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'facebook', 'pinterest', 'tiktok'];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { content, platforms, brandVoice, industry } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    const cleanContent = sanitize(content, 3000);
    const targetPlatforms = Array.isArray(platforms) && platforms.length > 0
      ? platforms.filter((p: string) => ALL_PLATFORMS.includes(p))
      : ALL_PLATFORMS;
    const cleanVoice = typeof brandVoice === 'string' ? sanitize(brandVoice, 500) : '';
    const cleanIndustry = typeof industry === 'string' ? sanitize(industry, 200) : '';

    // Build platform rules for targets
    const platformInstructions = targetPlatforms
      .map((p: string) => PLATFORM_RULES[p])
      .filter(Boolean)
      .join('\n\n');

    const systemPrompt = `You are an expert social media content strategist who adapts content for different platforms while maintaining the core message and brand voice.

${cleanVoice ? `Brand voice: ${cleanVoice}` : ''}
${cleanIndustry ? `Industry: ${cleanIndustry}` : ''}

Your job: Take the original content and create platform-optimized versions that feel NATIVE to each platform — not just reformatted, but genuinely adapted to how users engage on that platform.

PLATFORM-SPECIFIC RULES:
${platformInstructions}

RESPONSE FORMAT: Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Repurpose this content for ${targetPlatforms.join(', ')}:

---
${cleanContent}
---

Return JSON:
{
  "versions": {
    ${targetPlatforms.map((p: string) => `"${p}": {
      "caption": "the adapted caption for ${p}",
      "hashtags": ["relevant", "hashtags"],
      "contentTip": "one sentence tip for maximizing engagement on ${p}"
    }`).join(',\n    ')}
  }
}`;

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
        max_tokens: 4000,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.error('[ai/repurpose] OpenAI error:', await res.text());
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    }

    const parsed = JSON.parse(raw);
    if (!parsed.versions) {
      return NextResponse.json({ error: 'Malformed AI response' }, { status: 502 });
    }

    return NextResponse.json({
      versions: parsed.versions,
      originalContent: cleanContent,
      platforms: targetPlatforms,
      model: 'gpt-4o',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ai/repurpose] Error:', err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Content repurposing failed' }, { status: 500 });
  }
}
