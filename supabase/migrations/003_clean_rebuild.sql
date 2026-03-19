-- BrandPilot — Clean rebuild for new Supabase project mvjlbqzfbqdnfrzakalu
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/mvjlbqzfbqdnfrzakalu/sql)
-- This drops any partial tables and rebuilds the full schema with fixed triggers.

-- ============================================================
-- 1. DROP EVERYTHING (safe — no real data on new project)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_created on public.profiles;
drop trigger if exists update_organizations_updated_at on public.organizations;
drop trigger if exists update_workspaces_updated_at on public.workspaces;
drop trigger if exists update_posts_updated_at on public.posts;
drop trigger if exists update_campaigns_updated_at on public.campaigns;
drop trigger if exists update_profiles_updated_at on public.profiles;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_profile() cascade;
drop function if exists public.update_updated_at() cascade;
drop function if exists public.user_has_workspace_access(uuid) cascade;

drop table if exists public.make_scenarios cascade;
drop table if exists public.approval_requests cascade;
drop table if exists public.ai_generations cascade;
drop table if exists public.post_analytics cascade;
drop table if exists public.analytics_snapshots cascade;
drop table if exists public.post_media cascade;
drop table if exists public.assets cascade;
drop table if exists public.posts cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.social_accounts cascade;
drop table if exists public.brand_guidelines cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.org_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.profiles cascade;
-- Also drop any old tables from partial migrations
drop table if exists public.automation_rules cascade;
drop table if exists public.content_plans cascade;

-- ============================================================
-- 2. EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 3. TABLES
-- ============================================================

-- PROFILES (synced from auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORGANIZATIONS
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  max_workspaces integer default 2,
  max_posts_per_month integer default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORG MEMBERS
create table public.org_members (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- WORKSPACES (one per brand)
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  slug text not null,
  logo_url text,
  brand_color_primary text default '#000000',
  brand_color_secondary text default '#ffffff',
  industry text,
  timezone text default 'America/Barbados',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, slug)
);

-- BRAND GUIDELINES
create table public.brand_guidelines (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null unique,
  tone_of_voice text,
  writing_style text,
  topics_to_cover text[] default '{}',
  topics_to_avoid text[] default '{}',
  hashtag_sets jsonb default '{}',
  caption_templates text[] default '{}',
  color_palette jsonb default '[]',
  example_captions text[] default '{}',
  updated_at timestamptz default now()
);

-- SOCIAL ACCOUNTS
create table public.social_accounts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'twitter', 'pinterest', 'tiktok')),
  platform_account_id text not null,
  account_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean default true,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, platform, platform_account_id)
);

-- CAMPAIGNS
create table public.campaigns (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date date,
  end_date date,
  utm_campaign text,
  goal text,
  target_metrics jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- POSTS
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by uuid references public.profiles(id) not null,
  content_type text not null default 'single' check (content_type in ('single', 'carousel', 'reel', 'story', 'text_only')),
  caption text,
  hashtags text[] default '{}',
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  target_platforms text[] not null default '{}',
  ai_generated boolean default false,
  ai_prompt text,
  ai_model text,
  ai_image_model text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  platform_post_ids jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_posts_workspace on public.posts(workspace_id);
create index idx_posts_status on public.posts(status);
create index idx_posts_scheduled on public.posts(scheduled_at) where status = 'scheduled';

-- POST MEDIA
create table public.post_media (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  media_type text not null check (media_type in ('image', 'video', 'gif')),
  storage_path text,
  url text not null,
  alt_text text,
  position integer not null default 0,
  width integer,
  height integer,
  file_size bigint,
  created_at timestamptz default now()
);

create index idx_post_media_post on public.post_media(post_id);

-- ANALYTICS SNAPSHOTS
create table public.analytics_snapshots (
  id uuid default gen_random_uuid() primary key,
  social_account_id uuid references public.social_accounts(id) on delete cascade not null,
  snapshot_date date not null,
  followers integer,
  following integer,
  posts_count integer,
  impressions integer default 0,
  reach integer default 0,
  engagement integer default 0,
  profile_views integer default 0,
  website_clicks integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(social_account_id, snapshot_date)
);

-- POST ANALYTICS
create table public.post_analytics (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  platform text not null,
  platform_post_id text,
  impressions integer default 0,
  reach integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  clicks integer default 0,
  engagement_rate numeric(5,2) default 0,
  last_synced_at timestamptz default now(),
  unique(post_id, platform)
);

-- ASSETS
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id),
  name text not null,
  asset_type text not null check (asset_type in ('image', 'video', 'template', 'logo', 'font')),
  storage_path text not null,
  url text not null,
  tags text[] default '{}',
  width integer,
  height integer,
  file_size bigint,
  created_at timestamptz default now()
);

-- AI GENERATION LOG
create table public.ai_generations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id),
  generation_type text not null check (generation_type in ('caption', 'hashtags', 'image', 'carousel_outline', 'campaign_plan', 'repurpose')),
  prompt text not null,
  result text,
  model text not null,
  tokens_used integer,
  cost_cents integer,
  rating integer check (rating between 1 and 5),
  used_in_post uuid references public.posts(id),
  created_at timestamptz default now()
);

-- APPROVAL REQUESTS
create table public.approval_requests (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  requested_by uuid references public.profiles(id) not null,
  assigned_to uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revision_requested')),
  notes text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

-- MAKE SCENARIOS
create table public.make_scenarios (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  make_scenario_id integer not null,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'inactive', 'error')),
  last_run_at timestamptz,
  last_run_status text,
  schedule_description text,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.workspaces enable row level security;
alter table public.brand_guidelines enable row level security;
alter table public.social_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.post_analytics enable row level security;
alter table public.assets enable row level security;
alter table public.ai_generations enable row level security;
alter table public.approval_requests enable row level security;
alter table public.make_scenarios enable row level security;

-- Helper: check workspace access via org membership
create or replace function public.user_has_workspace_access(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspaces w
    join public.org_members om on om.org_id = w.org_id
    where w.id = ws_id and om.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- Organizations
create policy "orgs_select" on public.organizations for select using (
  id in (select org_id from public.org_members where user_id = auth.uid())
);
create policy "orgs_insert" on public.organizations for insert with check (owner_id = auth.uid());
create policy "orgs_update" on public.organizations for update using (owner_id = auth.uid());

-- Org members
create policy "org_members_select" on public.org_members for select using (
  org_id in (select org_id from public.org_members where user_id = auth.uid())
);
create policy "org_members_insert" on public.org_members for insert with check (
  org_id in (select id from public.organizations where owner_id = auth.uid())
);

-- Workspaces
create policy "workspaces_select" on public.workspaces for select using (
  public.user_has_workspace_access(id)
);
create policy "workspaces_insert" on public.workspaces for insert with check (
  org_id in (select org_id from public.org_members where user_id = auth.uid() and role in ('owner', 'admin'))
);
create policy "workspaces_update" on public.workspaces for update using (
  public.user_has_workspace_access(id)
);

-- Workspace-scoped tables
create policy "brand_guidelines_all" on public.brand_guidelines for all using (public.user_has_workspace_access(workspace_id));
create policy "social_accounts_all" on public.social_accounts for all using (public.user_has_workspace_access(workspace_id));
create policy "campaigns_all" on public.campaigns for all using (public.user_has_workspace_access(workspace_id));
create policy "posts_all" on public.posts for all using (public.user_has_workspace_access(workspace_id));
create policy "post_media_all" on public.post_media for all using (
  post_id in (select id from public.posts where public.user_has_workspace_access(workspace_id))
);
create policy "analytics_snapshots_all" on public.analytics_snapshots for all using (
  social_account_id in (select id from public.social_accounts where public.user_has_workspace_access(workspace_id))
);
create policy "post_analytics_all" on public.post_analytics for all using (
  post_id in (select id from public.posts where public.user_has_workspace_access(workspace_id))
);
create policy "assets_all" on public.assets for all using (public.user_has_workspace_access(workspace_id));
create policy "ai_generations_all" on public.ai_generations for all using (public.user_has_workspace_access(workspace_id));
create policy "approval_requests_all" on public.approval_requests for all using (
  post_id in (select id from public.posts where public.user_has_workspace_access(workspace_id))
);
create policy "make_scenarios_all" on public.make_scenarios for all using (public.user_has_workspace_access(workspace_id));

-- ============================================================
-- 5. TRIGGERS (FIXED — includes email in profile insert)
-- ============================================================

-- Consolidated: profile + org + membership on signup (single trigger)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
begin
  -- Create profile (FIXED: includes email)
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Create default organization
  insert into public.organizations (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Organization',
    replace(lower(split_part(new.email, '@', 1)), '.', '-') || '-org-' || substring(new.id::text, 1, 8),
    new.id
  )
  returning id into new_org_id;

  -- Add as owner
  insert into public.org_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_organizations_updated_at before update on public.organizations for each row execute function public.update_updated_at();
create trigger update_workspaces_updated_at before update on public.workspaces for each row execute function public.update_updated_at();
create trigger update_posts_updated_at before update on public.posts for each row execute function public.update_updated_at();
create trigger update_campaigns_updated_at before update on public.campaigns for each row execute function public.update_updated_at();
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
