import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';
import { authorizeForOrg } from '@/lib/auth';

const checkRateLimit = createRateLimiter(30, 60_000);

// GET /api/billing/usage?orgId=xxx — get current usage metrics
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  // Auth: verify requesting user belongs to this org
  const user = await authorizeForOrg(orgId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  // Get org plan info
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('plan, max_workspaces, max_posts_per_month')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Single query to get workspace IDs (used for both count and sub-queries)
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('organization_id', orgId);

  if (wsError) {
    console.error('[usage] Workspace query error:', wsError);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }

  const workspaceIds = (workspaces || []).map(w => w.id);
  const workspaceCount = workspaceIds.length;

  // Count posts this month (across all workspaces in the org)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let postsThisMonth = 0;
  let blogPostsThisMonth = 0;
  let socialAccountCount = 0;

  if (workspaceIds.length > 0) {
    // Run counts in parallel to reduce latency
    const [postResult, blogResult, accountResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds)
        .gte('created_at', startOfMonth),
      supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds)
        .gte('created_at', startOfMonth),
      supabase
        .from('social_accounts')
        .select('id', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds),
    ]);

    postsThisMonth = postResult.count || 0;
    blogPostsThisMonth = blogResult.count || 0;
    socialAccountCount = accountResult.count || 0;
  }

  return NextResponse.json({
    plan: org.plan,
    usage: {
      workspaces: { used: workspaceCount, limit: org.max_workspaces },
      postsThisMonth: { used: postsThisMonth, limit: org.max_posts_per_month },
      blogPostsThisMonth: { used: blogPostsThisMonth, limit: 0 },
      socialAccounts: { used: socialAccountCount, limit: 0 },
    },
  });
}
