import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { generatePreviewToken } from '@/lib/preview-token';
import { authorizeForWorkspace } from '@/lib/auth';

const checkRateLimit = createRateLimiter(20, 60_000);

// POST /api/blog/preview — Generate a shareable preview URL for a blog post
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json();
  const { postId } = body as { postId: string };
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  // Fetch the post to get its workspace_id
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, slug, workspace_id')
    .eq('id', postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Verify user owns this workspace
  const auth = await authorizeForWorkspace(post.workspace_id);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get workspace slug for the URL
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', post.workspace_id)
    .single();

  const token = generatePreviewToken(postId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandpilots.io';
  const previewUrl = `${appUrl}/api/public/blog/${post.slug}?workspace=${workspace?.slug || ''}&preview=${token}`;

  return NextResponse.json({ previewUrl, token, expiresIn: '7 days' });
}
