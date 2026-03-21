import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(10, 60_000, 'ai-best-time');

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
    const { platform, industry, contentType, timezone } = body;

    const cleanPlatform = platform ? sanitize(platform, 50) : 'instagram';
    const cleanIndustry = industry ? sanitize(industry, 200) : '';
    const cleanType = contentType ? sanitize(contentType, 50) : '';
    const cleanTz = timezone ? sanitize(timezone, 50) : 'UTC';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const prompt = `You are a social media analytics expert. Recommend the best times to post on ${cleanPlatform} for maximum engagement.
${cleanIndustry ? `Industry: ${cleanIndustry}` : ''}
${cleanType ? `Content type: ${cleanType}` : ''}
Timezone: ${cleanTz}

Return JSON:
{
  "best_times": [
    { "day": "Monday", "times": ["9:00 AM", "12:30 PM", "6:00 PM"], "reason": "Why these times work" },
    { "day": "Tuesday", "times": ["10:00 AM", "2:00 PM"], "reason": "Why" },
    { "day": "Wednesday", "times": ["9:00 AM", "1:00 PM", "5:00 PM"], "reason": "Why" },
    { "day": "Thursday", "times": ["10:00 AM", "3:00 PM"], "reason": "Why" },
    { "day": "Friday", "times": ["11:00 AM", "4:00 PM"], "reason": "Why" },
    { "day": "Saturday", "times": ["10:00 AM", "1:00 PM"], "reason": "Why" },
    { "day": "Sunday", "times": ["9:00 AM", "5:00 PM"], "reason": "Why" }
  ],
  "peak_window": { "day": "Best day", "time": "Best time", "reason": "Why this is THE best slot" },
  "avoid": ["Times/days to avoid posting and why"],
  "platform_tips": ["3 platform-specific tips for ${cleanPlatform}"],
  "frequency": "Recommended posting frequency"
}

Use real engagement data patterns. Times in ${cleanTz}. Return ONLY valid JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI best-time failed:', response.status);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (err) {
    console.error('Best time error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
