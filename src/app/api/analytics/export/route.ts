import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const checkRateLimit = createRateLimiter(5, 60_000, 'analytics-export');

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get posts for this workspace
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, caption, platforms, content_type, status, scheduled_for, published_at, created_at, likes_count, comments_count, shares_count, impressions')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Export query error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 });
    }

    // Build CSV
    const headers = [
      'Post ID',
      'Caption',
      'Platforms',
      'Content Type',
      'Status',
      'Scheduled For',
      'Published At',
      'Created At',
      'Likes',
      'Comments',
      'Shares',
      'Impressions',
      'Engagement Rate',
    ];

    const rows = posts.map(post => {
      const impressions = post.impressions || 0;
      const engagement = post.likes_count + post.comments_count + post.shares_count;
      const engagementRate = impressions > 0 ? ((engagement / impressions) * 100).toFixed(2) + '%' : 'N/A';

      return [
        post.id,
        `"${(post.caption || '').replace(/"/g, '""').slice(0, 200)}"`,
        (post.platforms || []).join('; '),
        post.content_type || '',
        post.status || '',
        post.scheduled_for || '',
        post.published_at || '',
        post.created_at || '',
        post.likes_count || 0,
        post.comments_count || 0,
        post.shares_count || 0,
        impressions,
        engagementRate,
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="brandpilot-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('Analytics export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
