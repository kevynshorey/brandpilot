import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(15, 60_000, 'ai-score');

function sanitize(text: string, maxLen = 2000): string {
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
    const { caption, platform, hashtags } = body;

    if (!caption || typeof caption !== 'string') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 });
    }

    const cleanCaption = sanitize(caption);
    const cleanPlatform = platform ? sanitize(platform, 50) : 'instagram';
    const cleanHashtags = Array.isArray(hashtags) ? hashtags.map(h => sanitize(h, 50)).join(', ') : '';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const prompt = `You are a social media content analyst. Score this ${cleanPlatform} post caption and provide actionable feedback.

CAPTION:
"""
${cleanCaption}
"""
${cleanHashtags ? `HASHTAGS: ${cleanHashtags}` : ''}

Return JSON:
{
  "overall_score": 78,
  "breakdown": {
    "hook_strength": { "score": 85, "feedback": "Specific feedback on the opening hook" },
    "clarity": { "score": 72, "feedback": "Is the message clear?" },
    "engagement_potential": { "score": 80, "feedback": "Will this drive comments/shares?" },
    "cta_effectiveness": { "score": 65, "feedback": "Is there a clear call to action?" },
    "platform_fit": { "score": 90, "feedback": "How well does this fit ${cleanPlatform}?" },
    "hashtag_quality": { "score": 70, "feedback": "Are the hashtags relevant and well-mixed?" }
  },
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ],
  "rewritten_version": "A better version of the caption with your improvements applied",
  "predicted_performance": "Low / Medium / High — and why"
}

Scores are 0-100. Be specific and actionable. Return ONLY valid JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI scoring failed:', response.status);
      return NextResponse.json({ error: 'AI scoring failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (err) {
    console.error('Content scoring error:', err);
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}
