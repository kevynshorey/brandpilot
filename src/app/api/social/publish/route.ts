import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser, verifyOrgMembership } from '@/lib/auth';
import { publishToAllPlatforms, type PublishRequest } from '@/lib/publishers';

const checkRateLimit = createRateLimiter(10, 60_000, 'social-publish');

// POST /api/social/publish — Publish a post to connected social platforms
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Auth: verify user is logged in
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { post_id } = body;

    if (!post_id || typeof post_id !== 'string') {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the post with workspace and media
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, workspace:workspaces!inner(org_id), post_media(*)')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify user has access to this post's org
    const orgId = (post.workspace as { org_id: string })?.org_id;
    if (orgId) {
      const hasAccess = await verifyOrgMembership(user.userId, orgId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    if (post.status === 'published') {
      return NextResponse.json({ error: 'Post is already published' }, { status: 400 });
    }

    // Mark as publishing
    await supabase.from('posts').update({ status: 'publishing' }).eq('id', post_id);

    const platforms = (post.target_platforms as string[]) || [];

    // Fetch connected social accounts for this workspace
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', post.workspace_id)
      .eq('is_active', true);

    // Build account map
    const accountsByPlatform = new Map<string, PublishRequest['account']>();
    for (const account of accounts || []) {
      accountsByPlatform.set(account.platform as string, {
        id: account.id as string,
        platform_account_id: account.platform_account_id as string,
        account_name: account.account_name as string,
        access_token: account.access_token as string | undefined,
        refresh_token: account.refresh_token as string | undefined,
        metadata: account.metadata as Record<string, unknown> | undefined,
      });
    }

    // Build post payload for publishers
    const publishPost: PublishRequest['post'] = {
      id: post.id as string,
      caption: post.caption as string,
      hashtags: (post.hashtags as string[]) || [],
      content_type: post.content_type as string,
      media: ((post.post_media || []) as Record<string, unknown>[]).map((m) => ({
        url: (m.url || m.media_url) as string,
        type: (m.media_type as 'image' | 'video' | 'gif') || 'image',
        alt_text: m.alt_text as string | undefined,
      })),
    };

    // Publish through the abstraction layer
    const results = await publishToAllPlatforms(publishPost, platforms, accountsByPlatform);

    // Determine overall status
    const allSucceeded = Object.values(results).every((r) => r.success);
    const anySucceeded = Object.values(results).some((r) => r.success);
    const finalStatus = allSucceeded ? 'published' : anySucceeded ? 'published' : 'failed';

    // Build platform_post_ids from successful publishes
    const platformPostIds: Record<string, string> = {};
    for (const [platform, result] of Object.entries(results)) {
      if (result.success && result.platform_post_id) {
        platformPostIds[platform] = result.platform_post_id;
      }
    }

    // Update post status
    const updateData: Record<string, unknown> = {
      status: finalStatus,
      published_at: finalStatus === 'published' ? new Date().toISOString() : null,
    };
    if (Object.keys(platformPostIds).length > 0) {
      updateData.platform_post_ids = platformPostIds;
    }

    const { error: statusError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post_id);

    if (statusError) {
      console.error('[publish] Failed to update post status:', statusError);
    }

    return NextResponse.json({
      success: anySucceeded,
      status: finalStatus,
      results,
    });
  } catch (err) {
    console.error('[publish] Error:', err);
    return NextResponse.json({ error: 'Publishing failed' }, { status: 500 });
  }
}
