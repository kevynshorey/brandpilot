import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';
import { checkPlanLimit, getOrgIdFromWorkspace } from '@/lib/plan-limits';

const checkRateLimit = createRateLimiter(30, 60_000);

// GET /api/social/accounts?workspace_id=xxx
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('social_accounts')
    .select('id, platform, account_name, is_active, platform_account_id, token_expires_at, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }

  return NextResponse.json({ accounts: data || [] });
}

// POST /api/social/accounts — Connect a new social account
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
    const { workspace_id, platform, account_name, platform_account_id, access_token, refresh_token, token_expires_at } = body;

    if (!workspace_id || !platform || !account_name) {
      return NextResponse.json({ error: 'workspace_id, platform, and account_name are required' }, { status: 400 });
    }

    // Enforce plan limit
    const orgId = await getOrgIdFromWorkspace(workspace_id);
    if (orgId) {
      const limit = await checkPlanLimit(orgId, 'social_accounts');
      if (!limit.allowed) {
        return NextResponse.json(
          { error: `Social account limit reached (${limit.used}/${limit.limit}). Upgrade your plan to connect more accounts.` },
          { status: 403 },
        );
      }
    }

    const validPlatforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'pinterest', 'tiktok'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from('social_accounts')
      .upsert({
        workspace_id,
        platform,
        account_name: account_name.slice(0, 200),
        platform_account_id: platform_account_id || null,
        access_token: access_token || null,
        refresh_token: refresh_token || null,
        token_expires_at: token_expires_at || null,
        is_active: true,
      }, { onConflict: 'workspace_id,platform,platform_account_id' })
      .select('id, platform, account_name, is_active, created_at')
      .single();

    if (error) {
      console.error('Social account upsert error:', error);
      return NextResponse.json({ error: 'Failed to connect account' }, { status: 500 });
    }

    return NextResponse.json({ account: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/social/accounts?id=xxx
export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.from('social_accounts').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
