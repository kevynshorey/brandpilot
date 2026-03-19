-- BrandPilot Schema Migration
-- Run this in the Supabase SQL Editor for project gyhkgxwshepzicrabcop

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 2. Org Members
CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 3. Workspaces (one per brand)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  industry text,
  description text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Brand Guidelines
CREATE TABLE IF NOT EXISTS public.brand_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  voice_tone text,
  color_primary text,
  color_secondary text,
  color_accent text,
  font_heading text,
  font_body text,
  tagline text,
  target_audience text,
  brand_values text[],
  content_pillars text[],
  do_list text[],
  dont_list text[],
  hashtag_groups jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Social Accounts (platform connections)
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','x','threads','pinterest','tiktok','facebook_ads','google_ads','google_analytics')),
  account_name text,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_connected boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, platform)
);

-- 6. Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text,
  content text,
  platform text NOT NULL,
  content_type text DEFAULT 'post' CHECK (content_type IN ('post','carousel','ad','story','reel_script','blog_promo')),
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  media_urls text[] DEFAULT '{}',
  hashtags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  ai_generated boolean DEFAULT false,
  engagement jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  start_date date,
  end_date date,
  budget numeric,
  goal text,
  platforms text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Assets (media library)
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  alt_text text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 9. Content Plans
CREATE TABLE IF NOT EXISTS public.content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  strategy jsonb,
  calendar jsonb,
  weekly_themes jsonb,
  kpis jsonb,
  platforms text[] DEFAULT '{}',
  posts_per_week integer DEFAULT 7,
  created_at timestamptz DEFAULT now()
);

-- 10. Automation Rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  action_type text NOT NULL,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizations: members can read their orgs
CREATE POLICY "org_members_read" ON public.organizations
  FOR SELECT USING (id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "org_owners_all" ON public.organizations
  FOR ALL USING (owner_id = auth.uid());

-- Org Members: members can see other members in their org
CREATE POLICY "members_read" ON public.org_members
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "owners_manage_members" ON public.org_members
  FOR ALL USING (org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid()));

-- Workspaces: org members can read
CREATE POLICY "workspace_read" ON public.workspaces
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_manage" ON public.workspaces
  FOR ALL USING (org_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid()));

-- Brand Guidelines: workspace members can read
CREATE POLICY "brand_read" ON public.brand_guidelines
  FOR SELECT USING (workspace_id IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.org_members om ON w.org_id = om.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "brand_manage" ON public.brand_guidelines
  FOR ALL USING (workspace_id IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.organizations o ON w.org_id = o.id
    WHERE o.owner_id = auth.uid()
  ));

-- Posts, Campaigns, Assets, Content Plans, Automation Rules: workspace members
CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.org_members om ON w.org_id = om.org_id WHERE om.user_id = auth.uid()));
CREATE POLICY "posts_manage" ON public.posts FOR ALL USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.organizations o ON w.org_id = o.id WHERE o.owner_id = auth.uid()));

CREATE POLICY "campaigns_read" ON public.campaigns FOR SELECT USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.org_members om ON w.org_id = om.org_id WHERE om.user_id = auth.uid()));
CREATE POLICY "campaigns_manage" ON public.campaigns FOR ALL USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.organizations o ON w.org_id = o.id WHERE o.owner_id = auth.uid()));

CREATE POLICY "assets_read" ON public.assets FOR SELECT USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.org_members om ON w.org_id = om.org_id WHERE om.user_id = auth.uid()));
CREATE POLICY "assets_manage" ON public.assets FOR ALL USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.organizations o ON w.org_id = o.id WHERE o.owner_id = auth.uid()));

CREATE POLICY "plans_read" ON public.content_plans FOR SELECT USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.org_members om ON w.org_id = om.org_id WHERE om.user_id = auth.uid()));
CREATE POLICY "plans_manage" ON public.content_plans FOR ALL USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.organizations o ON w.org_id = o.id WHERE o.owner_id = auth.uid()));

CREATE POLICY "automations_read" ON public.automation_rules FOR SELECT USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.org_members om ON w.org_id = om.org_id WHERE om.user_id = auth.uid()));
CREATE POLICY "automations_manage" ON public.automation_rules FOR ALL USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.organizations o ON w.org_id = o.id WHERE o.owner_id = auth.uid()));

CREATE POLICY "social_read" ON public.social_accounts FOR SELECT USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.org_members om ON w.org_id = om.org_id WHERE om.user_id = auth.uid()));
CREATE POLICY "social_manage" ON public.social_accounts FOR ALL USING (workspace_id IN (SELECT w.id FROM public.workspaces w JOIN public.organizations o ON w.org_id = o.id WHERE o.owner_id = auth.uid()));

-- Auth trigger: auto-create org + membership on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create org
  INSERT INTO public.organizations (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Org', NEW.id)
  RETURNING id INTO new_org_id;

  -- Add as owner member
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Create 4 default workspaces
  INSERT INTO public.workspaces (org_id, name, slug, industry) VALUES
    (new_org_id, 'Are You Vintage', 'are-you-vintage', 'Lifestyle & Fashion'),
    (new_org_id, 'Island Chem Solutions', 'island-chem', 'B2B Cleaning Products'),
    (new_org_id, 'Prime Barbados', 'prime-barbados', 'Luxury Real Estate'),
    (new_org_id, 'LaunchPath', 'launchpath', 'SaaS / EdTech');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done!
SELECT 'BrandPilot schema created successfully' as status;
