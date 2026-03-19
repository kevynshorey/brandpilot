-- 004_blog_posts.sql
-- Blog CMS table + indexes + RLS + triggers

-- 1. Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text DEFAULT '',
  meta_description text DEFAULT '',
  featured_image_url text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_urls text[] DEFAULT '{}',
  source_images jsonb DEFAULT '[]',
  ai_model text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT blog_posts_content_on_publish CHECK (status != 'published' OR length(content) > 0)
);

-- 2. Indexes
CREATE UNIQUE INDEX blog_posts_workspace_slug ON public.blog_posts(workspace_id, slug);
CREATE INDEX blog_posts_status_published ON public.blog_posts(workspace_id, status, published_at DESC)
  WHERE status = 'published';

-- 3. Standalone index on workspaces.slug for public API lookups
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON public.workspaces(slug);

-- 4. Auto-update updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_all" ON public.blog_posts
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- 6. Update ai_generations CHECK constraint to include 'blog'
ALTER TABLE public.ai_generations
  DROP CONSTRAINT IF EXISTS ai_generations_generation_type_check;

ALTER TABLE public.ai_generations
  ADD CONSTRAINT ai_generations_generation_type_check
  CHECK (generation_type IN ('caption', 'hashtags', 'image', 'carousel_outline', 'campaign_plan', 'repurpose', 'blog'));
