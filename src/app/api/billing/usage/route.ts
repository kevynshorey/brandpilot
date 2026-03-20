import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';

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

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  // Get org plan info
  const { data: org } = await supabase
    .from('organizations')
    .select('plan, max_workspaces, max_posts_per_month')
    .eq('id', orgId)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Count workspaces
  const { count: workspaceCount } = await supabase
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  // Count posts this month (across all workspaces in the org)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('organization_id', orgId);

  const workspaceIds = (workspaces || []).map(w => w.id);

  let postsThisMonth = 0;
  let blogPostsThisMonth = 0;
  let socialAccountCount = 0;

  if (workspaceIds.length > 0) {
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .in('workspace_id', workspaceIds)
      .gte('created_at', startOfMonth);

    postsThisMonth = postCount || 0;

    const { count: blogCount } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .in('workspace_id', workspaceIds)
      .gte('created_at', startOfMonth);

    blogPostsThisMonth = blogCount || 0;

    const { count: accountCount } = await supabase
      .from('social_accounts')
      .select('id', { count: 'exact', head: true })
      .in('workspace_id', workspaceIds);

    socialAccountCount = accountCount || 0;
  }

  return NextResponse.json({
    plan: org.plan,
    usage: {
      workspaces: { used: workspaceCount || 0, limit: org.max_workspaces },
      postsThisMonth: { used: postsThisMonth, limit: org.max_posts_per_month },
      blogPostsThisMonth: { used: blogPostsThisMonth, limit: 0 }, // limit comes from plan constants
      socialAccounts: { used: socialAccountCount, limit: 0 }, // limit comes from plan constants
    },
  });
}
