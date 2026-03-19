import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';

const checkRateLimit = createRateLimiter(30, 60_000);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/public/blog/[slug]?workspace=slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: CORS_HEADERS },
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const { searchParams } = new URL(request.url);
  const workspaceSlug = searchParams.get('workspace');
  if (!workspaceSlug) {
    return NextResponse.json(
      { error: 'workspace query parameter is required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { slug } = await params;

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single();

  if (!workspace) {
    return NextResponse.json(
      { error: 'Workspace not found' },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('title, slug, content, excerpt, meta_description, featured_image_url, tags, published_at')
    .eq('workspace_id', workspace.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Blog post not found' },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { post: data },
    { headers: CORS_HEADERS },
  );
}
