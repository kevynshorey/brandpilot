import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';
import { verifyPreviewToken } from '@/lib/preview-token';

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

  // Check for preview token — allows viewing unpublished posts
  const previewToken = searchParams.get('preview');
  let isPreview = false;

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, content, excerpt, meta_description, featured_image_url, tags, published_at, status')
    .eq('workspace_id', workspace.id)
    .eq('slug', slug);

  if (previewToken) {
    const verifiedPostId = verifyPreviewToken(previewToken);
    if (verifiedPostId) {
      // Valid preview token — fetch any status but verify post ID matches
      query = query.eq('id', verifiedPostId);
      isPreview = true;
    } else {
      // Invalid/expired token — fall back to published only
      query = query.eq('status', 'published');
    }
  } else {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Blog post not found' },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Build JSON-LD structured data for consuming sites
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.meta_description || data.excerpt || '',
    image: data.featured_image_url || undefined,
    datePublished: data.published_at,
    url: `https://${workspaceSlug}.brandpilots.io/blog/${data.slug}`,
    publisher: {
      '@type': 'Organization',
      name: workspaceSlug,
    },
    keywords: (data.tags || []).join(', '),
  };

  // OG metadata for consuming sites to embed
  const seo = {
    og_title: data.title,
    og_description: data.meta_description || data.excerpt || '',
    og_image: data.featured_image_url || null,
    canonical_url: `https://${workspaceSlug}.brandpilots.io/blog/${data.slug}`,
    json_ld: jsonLd,
  };

  return NextResponse.json(
    {
      post: data,
      seo,
      ...(isPreview && { preview: true, previewNotice: 'This is a preview. The post has not been published yet.' }),
    },
    { headers: CORS_HEADERS },
  );
}
