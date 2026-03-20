import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { checkPlanLimit, getOrgIdFromWorkspace, type LimitType } from '@/lib/plan-limits';

const checkRateLimit = createRateLimiter(30, 60_000);

const VALID_TYPES: LimitType[] = ['posts', 'blog_posts', 'social_accounts', 'workspaces'];

// GET /api/limits/check?workspace_id=xxx&type=posts
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');
  const limitType = searchParams.get('type') as LimitType | null;

  if (!workspaceId || !limitType || !VALID_TYPES.includes(limitType)) {
    return NextResponse.json(
      { error: 'workspace_id and valid type (posts, blog_posts, social_accounts, workspaces) are required' },
      { status: 400 },
    );
  }

  const orgId = await getOrgIdFromWorkspace(workspaceId);
  if (!orgId) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const result = await checkPlanLimit(orgId, limitType);
  return NextResponse.json(result);
}
