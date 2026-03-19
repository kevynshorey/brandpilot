import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { uniqueSlug } from '@/lib/slugify';

const checkRateLimit = createRateLimiter(20, 60_000);

function sanitize(text: string, maxLen = 2000): string {
  return text.replace(/<[^>]*>/g, '').replace(/\0/g, '').slice(0, maxLen).trim();
}

// GET /api/blog?workspace_id=...&status=...&page=...&limit=...
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
  }

  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('Blog list error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }

  return NextResponse.json({
    posts: data,
    pagination: { page, limit, total: count || 0 },
  });
}

// POST /api/blog — create new blog post
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const workspaceId = body.workspace_id;
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const title = sanitize(String(body.title || ''), 500);
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Generate unique slug
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('workspace_id', workspaceId);
    const existingSlugs = (existing || []).map((p: { slug: string }) => p.slug);
    const slug = uniqueSlug(body.slug || title, existingSlugs);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        title,
        slug,
        content: sanitize(String(body.content || ''), 50000),
        excerpt: sanitize(String(body.excerpt || ''), 1000),
        meta_description: sanitize(String(body.meta_description || ''), 200),
        featured_image_url: body.featured_image_url || null,
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20).map((t: unknown) => sanitize(String(t), 50)) : [],
        status: 'draft',
        source_urls: Array.isArray(body.source_urls) ? body.source_urls.slice(0, 10).filter((u: unknown) => typeof u === 'string') : [],
        source_images: Array.isArray(body.source_images) ? body.source_images.slice(0, 20) : [],
        ai_model: body.ai_model || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Blog create error:', error);
      return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error('Blog create error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
