# Blog CMS & Content Curation Engine — Design Spec

**Date:** 2026-03-19
**Project:** BrandPilot
**Workspace:** Are You Vintage (primary), all workspaces supported

## Overview

A full blog content management system inside BrandPilot that enables content curation, AI-powered repurposing with Claude, image curation from the web, publishing via public API, and Instagram promotion generation. The AYV Lovable site will consume the public API to display blog posts.

## Core Workflow

1. **Research** — Paste URLs of existing articles to draw inspiration from. System scrapes text + images.
2. **Generate** — Claude (Anthropic API) deconstructs source content and rewrites it through the brand's voice and angle.
3. **Curate Images** — Select images from scraped sources, or generate hyper-realistic AI images via Nano Banana.
4. **Publish** — Save as draft or publish. Publishing makes the post available via public API.
5. **Promote** — Auto-generate Instagram promo post to market the blog.

## Database Schema

### New table: `blog_posts`

```sql
CREATE TABLE blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
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
  -- Prevent publishing empty posts
  CONSTRAINT blog_posts_content_on_publish CHECK (status != 'published' OR length(content) > 0)
);

-- Unique slug per workspace
CREATE UNIQUE INDEX blog_posts_workspace_slug ON blog_posts(workspace_id, slug);

-- Fast lookups for public API
CREATE INDEX blog_posts_status_published ON blog_posts(workspace_id, status, published_at DESC)
  WHERE status = 'published';

-- Auto-update updated_at trigger (matches existing pattern for posts, campaigns, etc.)
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS (uses existing helper function that joins workspaces → org_members)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_all" ON blog_posts
  FOR ALL USING (public.user_has_workspace_access(workspace_id));
```

### Slug handling

Slugs are generated from the title using a `slugify()` utility:
- Lowercase, replace spaces with hyphens, strip non-alphanumeric chars
- On collision (unique constraint violation), append `-2`, `-3`, etc.
- Validate: max 200 chars, only `[a-z0-9-]` allowed
- Claude's generated slug is used as a suggestion but always passed through `slugify()` + collision check

### Workspace slug index for public API

```sql
-- Standalone index on workspaces.slug for public API lookups (existing table, new index)
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);
```

### Fields detail

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `workspace_id` | uuid FK | Which brand owns this post |
| `created_by` | uuid FK | Author (profiles table) |
| `title` | text | Blog post title |
| `slug` | text | URL-friendly slug (unique per workspace, validated by slugify()) |
| `content` | text | Full blog body in markdown |
| `excerpt` | text | 2-3 sentence teaser for cards/social |
| `meta_description` | text | SEO meta description (155 chars target) |
| `featured_image_url` | text | Hero image URL |
| `tags` | text[] | Topic/category tags |
| `status` | text | `draft` / `published` / `archived` |
| `source_urls` | text[] | Original article URLs used as inspiration (internal only, never exposed publicly) |
| `source_images` | jsonb | Curated images array `[{url, alt, source}]` (internal only) |
| `ai_model` | text | Which AI model generated the content |
| `published_at` | timestamptz | When published (null if draft) |

## API Routes

### Shared rate limiter utility

Extract the duplicated `checkRateLimit` function into `src/lib/rate-limit.ts`:

```typescript
// src/lib/rate-limit.ts
export function createRateLimiter(limit: number, windowMs: number) {
  const map = new Map<string, { count: number; resetAt: number }>();
  return function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = map.get(key);
    if (!entry || now > entry.resetAt) {
      map.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}
```

All API routes (existing and new) should import from this shared utility.

### Private (authenticated, BrandPilot dashboard)

#### Authentication pattern

All private API routes must verify the Supabase session server-side:

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

This follows the existing pattern in the codebase. RLS provides workspace-level authorization on top of authentication.

#### `POST /api/ai/blog` (modify existing)

Existing route handles `generate_blog` and `generate_ig_preview`. Modifications:

- **Switch from OpenAI GPT-4o to Anthropic Claude** for blog generation
- Add new action: `research_urls` — accepts array of URLs, scrapes text + images, returns structured content
- `generate_blog` now accepts `sourceContent` (scraped article text) in addition to `topic`
- Claude system prompt includes brand voice from workspace guidelines + instruction to repurpose source content with original angle
- **Log all Claude calls to the existing `ai_generations` table** with `generation_type: 'blog'` (update the CHECK constraint to include this value)

**Actions:**

1. `research_urls` — Input: `{urls: string[]}`. Extends the existing `scraper.ts` (cheerio-based) with a new `scrapeArticle()` function that extracts article body text in addition to the existing title/description/images. Returns `{articles: [{url, title, text, images: [{url, alt}]}]}`.

2. `generate_blog` — Input: `{topic, sourceContent?, keywords?, length, brandName, brandVoice, industry}`. Claude repurposes source content or writes from scratch. Returns `{title, slug, metaDescription, content, excerpt, tags}`.

3. `generate_ig_preview` — (existing, unchanged). Takes blog title/excerpt/content, returns IG promo.

#### Blog CRUD: REST endpoints (new)

Use proper REST conventions with Next.js App Router HTTP method exports:

**`/api/blog/route.ts`:**
- `GET /api/blog?workspace_id=...&status=...&page=...` — List posts (paginated)
- `POST /api/blog` — Create new blog post (draft)

**`/api/blog/[id]/route.ts`:**
- `GET /api/blog/[id]` — Get single post
- `PATCH /api/blog/[id]` — Update post fields / change status (publish, archive)
- `DELETE /api/blog/[id]` — Delete post

All routes verify Supabase session server-side (see authentication pattern above). RLS enforces workspace access.

### Public (unauthenticated, for AYV site)

#### CORS

All public API responses include:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

For production, restrict `Access-Control-Allow-Origin` to the AYV domain.

#### `GET /api/public/blog`

Query params:
- `workspace` (required) — workspace slug (e.g., `are-you-vintage`)
- `page` (optional, default 1) — pagination
- `limit` (optional, default 10, max 50) — posts per page
- `tag` (optional) — filter by tag

**Whitelisted response fields** (source_urls, source_images, ai_model, created_by are NEVER exposed):
```json
{
  "posts": [
    {
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "featured_image_url": "...",
      "tags": ["..."],
      "published_at": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 42 }
}
```

Only returns posts with `status = 'published'`. Uses Supabase service role key to bypass RLS (server-side only). Rate limited at 30 req/min.

#### `GET /api/public/blog/[slug]`

Query params:
- `workspace` (required) — workspace slug

**Whitelisted response fields:**
```json
{
  "title": "...",
  "slug": "...",
  "content": "... (full markdown)",
  "excerpt": "...",
  "meta_description": "...",
  "featured_image_url": "...",
  "tags": ["..."],
  "published_at": "..."
}
```

Returns 404 if not found or not published. `source_urls`, `source_images`, `ai_model`, `created_by` are excluded.

## UI: `/blog` Page Redesign

### Layout

Two-view layout with tab navigation:

**Tab 1: "My Posts"** (default)
- Table/card list of all blog posts for the active workspace
- Columns: title, status badge (draft/published/archived), tags, published date, actions
- Filter by status dropdown
- Search by title
- Click row → opens edit view
- "Create New" button → switches to creator flow

**Tab 2: "Create New" / Edit**

Four-step creator flow:

**Step 1 — Research & Curate**
- Text area for topic/angle description
- URL input with "Add URL" button (up to 5 source URLs)
- "Research" button → calls `research_urls` action
- Shows scraped content previews in collapsible cards (title, first 200 chars, image thumbnails)
- Checkbox to select which source articles to feed to Claude

**Step 2 — Generate Blog**
- Shows selected sources summary
- Length selector (short/medium/long)
- Optional keywords input
- "Generate with Claude" button
- Full markdown preview of generated blog
- Inline edit capability (textarea that updates the preview)
- Regenerate button

**Step 3 — Images**
- Gallery of images scraped from source URLs (Step 1)
- Click to select featured image
- Option: "Generate AI Image" button — reuses existing `/api/ai/generate` endpoint with `type: 'image', imageModel: 'nano-banana'` for hyper-realistic images
- Featured image preview at top of blog

**Step 4 — Publish & Promote**
- Blog preview (title, featured image, content, tags, meta)
- Edit title, slug, excerpt, meta description, tags inline
- "Save as Draft" button
- "Publish" button (sets status + published_at)
- After save/publish: "Generate IG Promo" section appears
- IG preview card mockup (reuses existing design)
- "Save IG Post" creates social post in `posts` table linked to blog

### Edit View

When clicking an existing post from "My Posts":
- Same layout as creator Step 2-4
- Pre-populated with existing content
- Status controls: Draft → Publish, Published → Archive, Archive → Draft
- "Regenerate IG Promo" button for re-promoting

## AI Integration: Claude via Anthropic API

### New environment variable
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude access

### Blog generation prompt structure

**System prompt:**
- Senior content strategist role
- Brand context (name, voice, industry from workspace + guidelines)
- Content repurposing instructions: analyze source material, extract key insights, rewrite with original angle
- SEO optimization rules
- Writing rules (short paragraphs, H2 headings, hook in first sentence, clear CTA)
- Avoid AI-sounding patterns
- Return JSON format

**User prompt:**
- Topic/angle
- Source article content (if provided)
- Target keywords
- Target word count
- Instruction to create viral, shareable content

### Model
- `claude-sonnet-4-5-20250514` for blog generation (fast, high quality)
- Temperature: 0.8 for creative writing

### AI generation logging

All Claude blog generation calls are logged to the existing `ai_generations` table:
- `generation_type`: `'blog'` (add to CHECK constraint)
- `model`: `'claude-sonnet-4-5-20250514'`
- `tokens_used`: from Anthropic API response `usage` field
- `cost_cents`: calculated from token count

## Web Scraping

The `research_urls` action extends the existing `src/lib/scraper.ts` (cheerio-based).

### Implementation

Add a new `scrapeArticle()` function to the existing `scraper.ts` that extends `scrapeUrl()`:
- Reuses existing cheerio parsing, OG tag extraction, image deduplication, and tracking pixel filtering
- Adds article body text extraction: find `<article>`, `<main>`, or largest text block using cheerio
- Returns `{ title, description, text, images: [{url, alt}], ogImage }` — text is the new field

Do NOT create a separate regex-based scraper. The existing cheerio infrastructure handles edge cases (lazy images, picture elements, etc.) that regex would miss.

### Security
- Only allow `http:` and `https:` URL schemes
- Validate URL format before fetching
- Set timeout on fetch (10 seconds)
- Strip any script tags or executable content from scraped text
- Limit scraped content to 5000 chars per article
- Limit to 5 URLs per request
- Rate limit: 5 research requests per minute per IP (uses shared rate limiter)

## Hooks (TanStack Query)

New hooks in `src/hooks/use-blog.ts`:

- `useBlogPosts(workspaceId, status?)` — list blog posts (GET /api/blog)
- `useBlogPost(postId)` — single post (GET /api/blog/[id])
- `useCreateBlogPost()` — mutation (POST /api/blog)
- `useUpdateBlogPost()` — mutation (PATCH /api/blog/[id])
- `usePublishBlogPost()` — mutation (PATCH /api/blog/[id] with status: 'published')
- `useDeleteBlogPost()` — mutation (DELETE /api/blog/[id])
- `useResearchUrls()` — mutation to scrape URLs
- `useGenerateBlog()` — mutation to call Claude blog generation

## File Structure

```
src/
  app/
    (dashboard)/
      blog/
        page.tsx              — Blog management page (list + create/edit)
    api/
      ai/
        blog/
          route.ts            — Modified: Claude integration, research_urls action
      blog/
        route.ts              — New: GET (list) + POST (create)
        [id]/
          route.ts            — New: GET (single) + PATCH (update) + DELETE
      public/
        blog/
          route.ts            — New: Public read API (list) with CORS
          [slug]/
            route.ts          — New: Public read API (single post) with CORS
  hooks/
    use-blog.ts               — New: TanStack Query hooks for blog
  lib/
    rate-limit.ts             — New: Shared rate limiter utility
    scraper.ts                — Modified: Add scrapeArticle() function
    slugify.ts                — New: Slug generation + validation utility
```

## Out of Scope

- Rich text editor (WYSIWYG) — markdown textarea with preview is sufficient for v1
- Blog comments system
- Blog analytics (page views, read time) — future enhancement
- RSS feed — future enhancement
- Image upload to Supabase Storage — images referenced by URL for v1
- Multiple authors per post
- Blog post scheduling (auto-publish at future time)
- SEO sitemap generation for the AYV site

## Success Criteria

1. Can create a blog post from scratch or from source URLs
2. Claude generates high-quality, brand-voiced content from curated sources
3. Can manage posts (draft → publish → archive) from the dashboard
4. AYV Lovable site can fetch and display published posts via public API
5. Can generate IG promo posts for any published blog
6. All API routes rate-limited, authenticated (private), and inputs sanitized
7. Public API returns only whitelisted fields with proper CORS headers
