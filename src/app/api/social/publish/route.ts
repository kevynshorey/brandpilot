import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';

const checkRateLimit = createRateLimiter(10, 60_000);

// POST /api/social/publish — Publish a post to connected social platforms
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { post_id } = body;

    if (!post_id || typeof post_id !== 'string') {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, post_media(*)')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status === 'published') {
      return NextResponse.json({ error: 'Post is already published' }, { status: 400 });
    }

    // Mark as publishing
    await supabase
      .from('posts')
      .update({ status: 'publishing' })
      .eq('id', post_id);

    const platforms = (post.target_platforms as string[]) || [];
    const results: Record<string, { success: boolean; platform_post_id?: string; error?: string }> = {};

    // Fetch connected social accounts for this workspace
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', post.workspace_id)
      .eq('is_active', true);

    const accountsByPlatform = new Map<string, Record<string, unknown>>();
    for (const account of accounts || []) {
      accountsByPlatform.set(account.platform as string, account);
    }

    // Try Make.com webhook first (if configured)
    const makeWebhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL;

    for (const platform of platforms) {
      const account = accountsByPlatform.get(platform);

      if (makeWebhookUrl) {
        // Delegate to Make.com for actual publishing
        try {
          const makeRes = await fetch(makeWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'publish_post',
              post_id: post.id,
              platform,
              caption: post.caption,
              hashtags: post.hashtags,
              content_type: post.content_type,
              media: (post.post_media || []).map((m: Record<string, unknown>) => ({
                url: m.media_url,
                type: m.media_type,
              })),
              account_id: account ? account.platform_account_id : null,
              workspace_id: post.workspace_id,
            }),
          });

          if (makeRes.ok) {
            const makeData = await makeRes.json();
            results[platform] = {
              success: true,
              platform_post_id: makeData.platform_post_id || `make_${Date.now()}`,
            };
          } else {
            results[platform] = { success: false, error: `Make.com returned ${makeRes.status}` };
          }
        } catch (err) {
          results[platform] = {
            success: false,
            error: err instanceof Error ? err.message : 'Make.com webhook failed',
          };
        }
      } else if (account) {
        // Direct API publishing (future implementation)
        // For now, mark as needing Make.com configuration
        results[platform] = {
          success: false,
          error: 'No publishing method configured. Connect Make.com or set up direct API integration.',
        };
      } else {
        results[platform] = {
          success: false,
          error: `No connected account for ${platform}`,
        };
      }
    }

    // Determine overall status
    const allSucceeded = Object.values(results).every(r => r.success);
    const anySucceeded = Object.values(results).some(r => r.success);
    const finalStatus = allSucceeded ? 'published' : anySucceeded ? 'published' : 'failed';

    // Build platform_post_ids from successful publishes
    const platformPostIds: Record<string, string> = {};
    for (const [platform, result] of Object.entries(results)) {
      if (result.success && result.platform_post_id) {
        platformPostIds[platform] = result.platform_post_id;
      }
    }

    // Update post status
    await supabase
      .from('posts')
      .update({
        status: finalStatus,
        published_at: finalStatus === 'published' ? new Date().toISOString() : null,
        platform_post_ids: Object.keys(platformPostIds).length > 0 ? platformPostIds : null,
      })
      .eq('id', post_id);

    return NextResponse.json({
      success: anySucceeded,
      status: finalStatus,
      results,
    });
  } catch (err) {
    console.error('Social publish error:', err);
    return NextResponse.json({ error: 'Publishing failed' }, { status: 500 });
  }
}
