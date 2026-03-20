'use client';

import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { LimitType } from '@/lib/plan-limits';

interface LimitCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
}

export function usePlanLimit(type: LimitType) {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery<LimitCheckResult>({
    queryKey: ['plan-limit', activeWorkspace?.id, type],
    queryFn: async () => {
      const res = await fetch(
        `/api/limits/check?workspace_id=${activeWorkspace!.id}&type=${type}`,
      );
      if (!res.ok) throw new Error('Failed to check limit');
      return res.json();
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 30_000, // cache for 30s to avoid hammering on every interaction
  });
}

/**
 * Pre-check a limit before mutation. Throws if limit exceeded.
 * Use inside mutationFn to enforce before the actual create call.
 */
export async function assertPlanLimit(
  workspaceId: string,
  type: LimitType,
): Promise<LimitCheckResult> {
  const res = await fetch(
    `/api/limits/check?workspace_id=${workspaceId}&type=${type}`,
  );
  if (!res.ok) throw new Error('Failed to check plan limit');
  const result: LimitCheckResult = await res.json();

  if (!result.allowed) {
    throw new PlanLimitError(type, result.used, result.limit, result.plan);
  }
  return result;
}

export class PlanLimitError extends Error {
  public readonly limitType: LimitType;
  public readonly used: number;
  public readonly limit: number;
  public readonly plan: string;

  constructor(type: LimitType, used: number, limit: number, plan: string) {
    const labels: Record<LimitType, string> = {
      posts: 'AI posts',
      blog_posts: 'blog posts',
      social_accounts: 'social accounts',
      workspaces: 'workspaces',
    };
    super(
      `You've reached your ${labels[type]} limit (${used}/${limit}) on the ${plan} plan. Upgrade to continue.`,
    );
    this.name = 'PlanLimitError';
    this.limitType = type;
    this.used = used;
    this.limit = limit;
    this.plan = plan;
  }
}
