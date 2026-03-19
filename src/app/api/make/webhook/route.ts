import { NextRequest, NextResponse } from 'next/server';

// Make.com webhook receiver
// Accepts batch generation requests from Make.com scenarios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workspace_id, count = 1 } = body;

    // TODO: Verify Make.com webhook signature
    // const signature = request.headers.get('x-make-signature');

    if (!action || !workspace_id) {
      return NextResponse.json({ error: 'Missing action or workspace_id' }, { status: 400 });
    }

    switch (action) {
      case 'generate_batch':
        // TODO: Generate batch of posts via AI and save as drafts
        return NextResponse.json({
          success: true,
          message: `Batch generation queued: ${count} posts for workspace ${workspace_id}`,
          post_ids: [],
        });

      case 'publish_scheduled':
        // TODO: Publish posts that are past their scheduled_at time
        return NextResponse.json({
          success: true,
          message: 'Scheduled posts publish triggered',
        });

      case 'sync_analytics':
        // TODO: Pull metrics from connected social accounts
        return NextResponse.json({
          success: true,
          message: 'Analytics sync triggered',
        });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('Make webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
