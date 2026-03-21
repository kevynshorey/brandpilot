import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';

const checkRateLimit = createRateLimiter(5, 60_000, 'ai-voice-analysis');

function sanitize(text: string, maxLen = 5000): string {
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
    const { text, url } = body;

    let contentToAnalyze = '';

    if (url && typeof url === 'string') {
      // Validate URL
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }

      // Scrape the URL for text content
      const scrapeResp = await fetch(url, {
        headers: { 'User-Agent': 'BrandPilot/1.0 (Voice Analyzer)' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!scrapeResp.ok) {
        return NextResponse.json({ error: 'Could not fetch URL content' }, { status: 400 });
      }

      const html = await scrapeResp.text();
      // Extract text from HTML (simple approach)
      contentToAnalyze = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);
    } else if (text && typeof text === 'string') {
      contentToAnalyze = sanitize(text);
    } else {
      return NextResponse.json({ error: 'Provide either text or URL to analyze' }, { status: 400 });
    }

    if (contentToAnalyze.length < 50) {
      return NextResponse.json({ error: 'Need at least 50 characters to analyze' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `You are a brand strategist and copywriting expert. Analyze the following text and extract the brand voice characteristics.

TEXT TO ANALYZE:
"""
${contentToAnalyze.slice(0, 3000)}
"""

Return a JSON object with this exact structure:
{
  "voice_profile": {
    "tone": "Primary tone (e.g., Professional, Casual, Playful, Authoritative)",
    "personality": "Brand personality in 3-4 words",
    "formality_score": 7,
    "energy_score": 6,
    "warmth_score": 8
  },
  "writing_patterns": {
    "sentence_style": "Description of typical sentence structure",
    "vocabulary_level": "Simple / Moderate / Sophisticated",
    "common_phrases": ["phrase 1", "phrase 2", "phrase 3"],
    "punctuation_style": "Description (e.g., Uses exclamation marks, Em dashes, Ellipses)"
  },
  "audience_signals": {
    "target_audience": "Who this content speaks to",
    "industry": "Detected industry",
    "values": ["value 1", "value 2", "value 3"]
  },
  "recommendations": {
    "social_tone": "Recommended social media tone based on this voice",
    "do_more": ["suggestion 1", "suggestion 2"],
    "avoid": ["thing to avoid 1", "thing to avoid 2"],
    "sample_caption": "A sample social media caption in this brand's voice"
  },
  "summary": "2-3 sentence summary of the brand voice"
}

Scores are 1-10. Return ONLY valid JSON, no markdown.`;

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
      console.error('OpenAI voice analysis failed:', response.status);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    }

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Voice analysis error:', err);
    return NextResponse.json({ error: 'Voice analysis failed' }, { status: 500 });
  }
}
