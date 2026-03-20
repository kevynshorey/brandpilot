-- 006: Performance indexes + Stripe webhook idempotency table
-- Run in production via Supabase SQL Editor

-- ============================================
-- Stripe webhook events (idempotency guard)
-- ============================================
create table if not exists public.stripe_webhook_events (
  id uuid default gen_random_uuid() primary key,
  event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Auto-cleanup: events older than 30 days (Stripe retries for max 3 days)
-- Run periodically via cron or pg_cron:
-- DELETE FROM stripe_webhook_events WHERE processed_at < now() - interval '30 days';

-- ============================================
-- Performance indexes
-- ============================================

-- Posts: scheduled publishing queries
create index if not exists idx_posts_status_scheduled_at
  on public.posts (status, scheduled_at)
  where status = 'scheduled';

-- Posts: monthly count queries (plan limits, usage)
create index if not exists idx_posts_workspace_created
  on public.posts (workspace_id, created_at);

-- Blog posts: monthly count queries (plan limits)
create index if not exists idx_blog_posts_workspace_created
  on public.blog_posts (workspace_id, created_at);

-- Social accounts: per-workspace lookups
create index if not exists idx_social_accounts_workspace_active
  on public.social_accounts (workspace_id, is_active)
  where is_active = true;

-- Workspaces: org lookup (for plan limit checks)
create index if not exists idx_workspaces_org_id
  on public.workspaces (organization_id);

-- Org members: user membership checks
create index if not exists idx_org_members_user_org
  on public.org_members (user_id, org_id);

-- Organizations: Stripe customer lookup (webhook handler)
create index if not exists idx_organizations_stripe_customer
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;
