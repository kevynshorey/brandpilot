import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(10, 60_000, 'ai-hashtags');

function sanitize(text: string, maxLen = 1000): string {
  return text.replace(/<[^>]*>/g, '').replace(/\0/g, '').slice(0, maxLen).trim();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { topic, platform, niche, count = 30 } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const cleanTopic = sanitize(topic, 500);
    const cleanNiche = niche ? sanitize(niche, 200) : '';
    const cleanPlatform = platform ? sanitize(platform, 50) : 'instagram';
    const hashtagCount = Math.min(Math.max(Number(count) || 30, 5), 60);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `You are an expert social media strategist. Generate ${hashtagCount} hashtags for the topic "${cleanTopic}" on ${cleanPlatform}.
${cleanNiche ? `The brand niche is: ${cleanNiche}` : ''}

Return a JSON object with this exact structure:
{
  "groups": [
    {
      "label": "High Volume (500K+ posts)",
      "hashtags": ["#hashtag1", "#hashtag2", ...],
      "description": "Popular hashtags for maximum reach"
    },
    {
      "label": "Medium Volume (50K-500K posts)",
      "hashtags": ["#hashtag1", "#hashtag2", ...],
      "description": "Good balance of reach and competition"
    },
    {
      "label": "Niche (Under 50K posts)",
      "hashtags": ["#hashtag1", "#hashtag2", ...],
      "description": "Lower competition, higher engagement rate"
    },
    {
      "label": "Branded & Trending",
      "hashtags": ["#hashtag1", "#hashtag2", ...],
      "description": "Trending and brand-specific tags"
    }
  ],
  "recommended_set": ["#tag1", "#tag2", "...up to 15 best picks"],
  "caption_tip": "A short tip on how to use these hashtags effectively"
}

Rules:
- All hashtags must start with #
- Mix of English hashtags, include trending formats
- Platform-specific optimization (${cleanPlatform} best practices)
- recommended_set should be the best ${Math.min(hashtagCount, 15)} hashtags to use together
- Return ONLY valid JSON, no markdown`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI hashtag generation failed:', response.status);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    }

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Hashtag generation error:', err);
    return NextResponse.json({ error: 'Hashtag generation failed' }, { status: 500 });
  }
}
