import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(5, 60_000, 'ai-competitor');

function sanitize(text: string, maxLen = 500): string {
  return text.replace(/<[^>]*>/g, '').replace(/\0/g, '').slice(0, maxLen).trim();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { competitor, platform, yourBrand } = body;

    if (!competitor || typeof competitor !== 'string') {
      return NextResponse.json({ error: 'Competitor name or handle is required' }, { status: 400 });
    }

    const cleanCompetitor = sanitize(competitor, 200);
    const cleanPlatform = platform ? sanitize(platform, 50) : 'instagram';
    const cleanBrand = yourBrand ? sanitize(yourBrand, 200) : '';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const prompt = `You are a competitive intelligence analyst for social media marketing. Analyze the competitor "${cleanCompetitor}" on ${cleanPlatform}.
${cleanBrand ? `The user's brand is: "${cleanBrand}"` : ''}

Based on your knowledge of this brand/company, provide a comprehensive competitive analysis. Return JSON:

{
  "competitor": {
    "name": "${cleanCompetitor}",
    "platform": "${cleanPlatform}",
    "estimated_followers": "Estimated follower range",
    "posting_frequency": "How often they post (e.g., '2-3x per day')",
    "primary_content_types": ["content type 1", "content type 2"]
  },
  "content_strategy": {
    "themes": ["Theme/pillar 1", "Theme/pillar 2", "Theme/pillar 3"],
    "tone": "Their brand voice description",
    "visual_style": "Description of their visual aesthetic",
    "engagement_tactics": ["Tactic 1", "Tactic 2", "Tactic 3"]
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness/gap 1", "Weakness/gap 2", "Weakness/gap 3"],
  "opportunities": [
    "Specific opportunity you can exploit based on their gaps",
    "Content angle they're missing",
    "Audience segment they're not serving"
  ],
  "content_ideas": [
    { "idea": "Specific post idea inspired by their strategy", "why": "Why this works" },
    { "idea": "Post idea that exploits their weakness", "why": "Why this works" },
    { "idea": "Differentiation post idea", "why": "Why this works" }
  ],
  "hashtags_they_use": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "summary": "2-3 sentence strategic summary"
}

Be specific and actionable. Return ONLY valid JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI competitor analysis failed:', response.status);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (err) {
    console.error('Competitor analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
