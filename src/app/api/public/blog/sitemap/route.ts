import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';

const checkRateLimit = createRateLimiter(10, 60_000);

// GET /api/public/blog/sitemap?workspace=slug
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceSlug = searchParams.get('workspace');
  if (!workspaceSlug) {
    return new NextResponse('workspace query parameter is required', { status: 400 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single();

  if (!workspace) {
    return new NextResponse('Workspace not found', { status: 404 });
  }

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .eq('workspace_id', workspace.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const baseUrl = `https://${workspaceSlug}.brandpilot.app`;
  const urls = (posts || []).map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.published_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
