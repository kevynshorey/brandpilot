'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/use-user';

interface UsageData {
  plan: string;
  usage: {
    workspaces: { used: number; limit: number };
    postsThisMonth: { used: number; limit: number };
    blogPostsThisMonth: { used: number; limit: number };
    socialAccounts: { used: number; limit: number };
  };
}

export function useBillingUsage() {
  const { data: org } = useOrganization();
  const orgId = (org as Record<string, unknown>)?.id as string | undefined;

  return useQuery<UsageData>({
    queryKey: ['billing-usage', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/billing/usage?orgId=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
    enabled: !!orgId,
    staleTime: 60_000, // refresh every minute
  });
}

export function useCheckout() {
  const { data: org } = useOrganization();
  const orgId = (org as Record<string, unknown>)?.id as string | undefined;

  return useMutation({
    mutationFn: async ({ planId, billing }: { planId: string; billing: 'monthly' | 'yearly' }) => {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, planId, billing }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout');
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}

export function useCustomerPortal() {
  const { data: org } = useOrganization();
  const orgId = (org as Record<string, unknown>)?.id as string | undefined;

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to open portal');
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}
