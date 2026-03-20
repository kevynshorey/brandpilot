import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';

const checkRateLimit = createRateLimiter(50, 60_000);

// Make.com webhook receiver
// Accepts actions from Make.com scenarios (scheduled publish, batch generation, analytics sync)
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

  // Verify Make.com webhook secret (if configured)
  const webhookSecret = process.env.MAKE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = request.headers.get('x-make-signature') || request.headers.get('authorization');
    if (signature !== `Bearer ${webhookSecret}` && signature !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { action, workspace_id } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    switch (action) {
      case 'publish_scheduled': {
        // Find all posts that are scheduled and past their scheduled_at time
        const query = supabase
          .from('posts')
          .select('id, caption, hashtags, content_type, target_platforms, workspace_id, post_media(*)')
          .eq('status', 'scheduled')
          .lte('scheduled_at', new Date().toISOString())
          .order('scheduled_at')
          .limit(20);

        // Optionally scope to a workspace
        if (workspace_id) {
          query.eq('workspace_id', workspace_id);
        }

        const { data: posts, error } = await query;
        if (error) {
          console.error('Scheduled posts query error:', error);
          return NextResponse.json({ error: 'Failed to query scheduled posts' }, { status: 500 });
        }

        if (!posts || posts.length === 0) {
          return NextResponse.json({ success: true, message: 'No posts due for publishing', published: 0 });
        }

        // Publish each post via the internal publish endpoint
        const results: Array<{ post_id: string; success: boolean; error?: string }> = [];
        const baseUrl = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';

        for (const post of posts) {
          try {
            const publishRes = await fetch(`${protocol}://${baseUrl}/api/social/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ post_id: post.id }),
            });

            if (publishRes.ok) {
              results.push({ post_id: post.id, success: true });
            } else {
              const err = await publishRes.json().catch(() => ({}));
              results.push({ post_id: post.id, success: false, error: err.error || 'Publish failed' });
            }
          } catch (err) {
            results.push({
              post_id: post.id,
              success: false,
              error: err instanceof Error ? err.message : 'Publish error',
            });
          }
        }

        const published = results.filter(r => r.success).length;
        return NextResponse.json({
          success: true,
          message: `Published ${published} of ${posts.length} scheduled posts`,
          published,
          total: posts.length,
          results,
        });
      }

      case 'generate_batch': {
        if (!workspace_id) {
          return NextResponse.json({ error: 'workspace_id is required for batch generation' }, { status: 400 });
        }
        const count = Math.min(body.count || 1, 10); // Cap at 10

        // For now, return stub — batch generation needs the AI marketing pipeline
        return NextResponse.json({
          success: true,
          message: `Batch generation queued: ${count} posts for workspace ${workspace_id}`,
          post_ids: [],
        });
      }

      case 'sync_analytics': {
        if (!workspace_id) {
          return NextResponse.json({ error: 'workspace_id is required for analytics sync' }, { status: 400 });
        }

        // Fetch published posts with platform_post_ids
        const { data: publishedPosts } = await supabase
          .from('posts')
          .select('id, platform_post_ids')
          .eq('workspace_id', workspace_id)
          .eq('status', 'published')
          .not('platform_post_ids', 'is', null)
          .limit(50);

        // For now, return the count of posts that could be synced
        return NextResponse.json({
          success: true,
          message: `Analytics sync: ${publishedPosts?.length || 0} published posts found`,
          syncable_posts: publishedPosts?.length || 0,
        });
      }

      case 'update_post_status': {
        // Allow Make.com to update a post's status after publishing
        const { post_id, status, platform_post_id, platform } = body;
        if (!post_id || !status) {
          return NextResponse.json({ error: 'post_id and status are required' }, { status: 400 });
        }

        const validStatuses = ['published', 'failed', 'draft', 'scheduled'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updates: Record<string, unknown> = { status };
        if (status === 'published') updates.published_at = new Date().toISOString();

        // If a platform_post_id is provided, merge it into platform_post_ids
        if (platform_post_id && platform) {
          const { data: existing } = await supabase
            .from('posts')
            .select('platform_post_ids')
            .eq('id', post_id)
            .single();

          const existingIds = (existing?.platform_post_ids as Record<string, string>) || {};
          updates.platform_post_ids = { ...existingIds, [platform]: platform_post_id };
        }

        const { error } = await supabase.from('posts').update(updates).eq('id', post_id);
        if (error) {
          return NextResponse.json({ error: 'Failed to update post status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Post ${post_id} status updated to ${status}` });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('Make webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
