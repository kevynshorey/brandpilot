import { NextRequest, NextResponse } from 'next/server';

// Rate limiting (simple in-memory, per-IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
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

// Input sanitization
function sanitize(text: string, maxLen = 2000): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML
    .replace(/\0/g, '')       // strip null bytes
    .slice(0, maxLen)
    .trim();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const body = await request.json();
    const {
      type = 'caption', // 'caption' | 'image'
      topic,
      brandVoice,
      platform,
      imageModel = 'nano-banana', // 'nano-banana' | 'gpt-image'
    } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const cleanTopic = sanitize(topic, 500);
    const cleanVoice = brandVoice ? sanitize(brandVoice, 1000) : '';

    if (type === 'caption') {
      return await generateCaption(cleanTopic, cleanVoice, platform);
    } else if (type === 'image') {
      return await generateImage(cleanTopic, imageModel);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    console.error('AI generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

async function generateCaption(topic: string, brandVoice: string, platform?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const systemPrompt = `You are a social media content writer. ${brandVoice ? `Brand voice: ${brandVoice}.` : ''} Return ONLY valid JSON with fields: caption (string), hashtags (array of strings, 15-20 relevant hashtags without #).`;

  const userPrompt = `Write a ${platform || 'social media'} post about: ${topic}. Make it 2-3 sentences with a hook and call-to-action. Return only valid JSON.`;

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
      max_tokens: 500,
      temperature: 0.85,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OpenAI error:', errText);
    return NextResponse.json({ error: 'Caption generation failed' }, { status: 502 });
  }

  const data = await res.json();
  const result = JSON.parse(data.choices[0].message.content);

  return NextResponse.json({
    caption: result.caption,
    hashtags: result.hashtags,
    model: 'gpt-4o',
  });
}

async function generateImage(topic: string, imageModel: string) {
  if (imageModel === 'nano-banana') {
    return await generateNanoBanana(topic);
  } else if (imageModel === 'gpt-image') {
    return await generateGptImage(topic);
  }
  return NextResponse.json({ error: 'Invalid image model' }, { status: 400 });
}

async function generateNanoBanana(topic: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const prompt = `Generate a professional, minimal editorial image for a social media post. Theme: ${topic}. Style: clean, warm tones, modern aesthetic, photorealistic. No text, no watermarks, no logos. Square format.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini error:', errText);
    return NextResponse.json({ error: 'Nano Banana image generation failed' }, { status: 502 });
  }

  const data = await res.json();

  // Find the image part in the response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData);

  if (!imagePart) {
    return NextResponse.json({ error: 'No image generated' }, { status: 502 });
  }

  return NextResponse.json({
    image: imagePart.inlineData.data, // base64
    mimeType: imagePart.inlineData.mimeType,
    model: 'nano-banana',
  });
}

async function generateGptImage(topic: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const prompt = `Professional, minimal editorial image for a social media post. Theme: ${topic}. Clean, warm tones, modern aesthetic. No text or watermarks.`;

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OpenAI image error:', errText);
    return NextResponse.json({ error: 'GPT image generation failed' }, { status: 502 });
  }

  const data = await res.json();

  return NextResponse.json({
    image: data.data[0].b64_json, // base64
    mimeType: 'image/png',
    model: 'gpt-image-1',
  });
}
