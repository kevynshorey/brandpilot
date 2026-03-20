import { createClient as createServiceClient } from '@supabase/supabase-js';
import { PLANS, type PlanId } from '@/lib/billing-plans';

export type LimitType =
  | 'posts'
  | 'blog_posts'
  | 'social_accounts'
  | 'workspaces';

interface LimitCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanId;
}

/**
 * Server-side plan limit checker.
 * Queries Supabase to check if an org has capacity for a given resource type.
 */
export async function checkPlanLimit(
  orgId: string,
  limitType: LimitType,
): Promise<LimitCheckResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server configuration error');
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  // Get org plan
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const planId = ((org?.plan as string) || 'free') as PlanId;
  const plan = PLANS[planId] || PLANS.free;

  // Get all workspace IDs for this org
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', orgId);

  const workspaceIds = (workspaces || []).map((w) => w.id);

  let used = 0;
  let limit = 0;

  switch (limitType) {
    case 'workspaces': {
      used = workspaceIds.length;
      limit = plan.limits.maxWorkspaces;
      break;
    }
    case 'posts': {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      if (workspaceIds.length > 0) {
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds)
          .gte('created_at', startOfMonth);
        used = count || 0;
      }
      limit = plan.limits.maxPostsPerMonth;
      break;
    }
    case 'blog_posts': {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      if (workspaceIds.length > 0) {
        const { count } = await supabase
          .from('blog_posts')
          .select('id', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds)
          .gte('created_at', startOfMonth);
        used = count || 0;
      }
      limit = plan.limits.maxBlogPostsPerMonth;
      break;
    }
    case 'social_accounts': {
      if (workspaceIds.length > 0) {
        const { count } = await supabase
          .from('social_accounts')
          .select('id', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds);
        used = count || 0;
      }
      limit = plan.limits.maxSocialAccounts;
      break;
    }
  }

  return {
    allowed: used < limit,
    used,
    limit,
    plan: planId,
  };
}

/**
 * Resolve orgId from a workspaceId (for API routes that only receive workspace_id).
 */
export async function getOrgIdFromWorkspace(workspaceId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server configuration error: missing Supabase env vars');
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from('workspaces')
    .select('org_id')
    .eq('id', workspaceId)
    .single();

  if (error) {
    console.error('[plan-limits] Failed to resolve org from workspace:', error);
    return null;
  }

  return data?.org_id ?? null;
}
