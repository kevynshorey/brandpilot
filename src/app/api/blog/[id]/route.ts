import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limit';

const checkRateLimit = createRateLimiter(20, 60_000);

function sanitize(text: string, maxLen = 2000): string {
  return text.replace(/<[^>]*>/g, '').replace(/\0/g, '').slice(0, maxLen).trim();
}

// GET /api/blog/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  }

  return NextResponse.json({ post: data });
}

// PATCH /api/blog/[id] — update fields, change status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = sanitize(String(body.title), 500);
    if (body.slug !== undefined) updates.slug = sanitize(String(body.slug), 200);
    if (body.content !== undefined) updates.content = sanitize(String(body.content), 50000);
    if (body.excerpt !== undefined) updates.excerpt = sanitize(String(body.excerpt), 1000);
    if (body.meta_description !== undefined) updates.meta_description = sanitize(String(body.meta_description), 200);
    if (body.featured_image_url !== undefined) updates.featured_image_url = body.featured_image_url || null;
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.slice(0, 20).map((t: unknown) => sanitize(String(t), 50)) : [];
    if (body.source_urls !== undefined) updates.source_urls = Array.isArray(body.source_urls) ? body.source_urls.slice(0, 10) : [];
    if (body.source_images !== undefined) updates.source_images = Array.isArray(body.source_images) ? body.source_images.slice(0, 20) : [];

    if (body.status !== undefined) {
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === 'published') {
        updates.published_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Blog update error:', error);
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
    }

    return NextResponse.json({ post: data });
  } catch (err) {
    console.error('Blog update error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE /api/blog/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Blog delete error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
