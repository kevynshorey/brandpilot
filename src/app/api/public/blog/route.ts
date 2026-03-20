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

// GET /api/public/blog?workspace=slug&page=1&limit=10&tag=...
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
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

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const tag = searchParams.get('tag');
  const offset = (page - 1) * limit;

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

  let query = supabase
    .from('blog_posts')
    .select('title, slug, excerpt, featured_image_url, tags, published_at', { count: 'exact' })
    .eq('workspace_id', workspace.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('Public blog list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { posts: data, pagination: { page, limit, total: count || 0 } },
    { headers: CORS_HEADERS },
  );
}
