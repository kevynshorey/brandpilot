# BrandPilot — Claude Code Project Instructions

## What is BrandPilot?
A multi-brand social media management SaaS that enables centralized content creation, scheduling, publishing, and analytics across Instagram, LinkedIn, X, Pinterest, Facebook, and TikTok. Supports multiple brand workspaces with AI-powered content generation and Make.com automation integration.

## Tech Stack
- **Framework**: Next.js 16 App Router + TypeScript
- **Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, RLS)
- **UI**: shadcn/ui + Tailwind CSS + Lucide icons
- **State**: TanStack Query (server state) + Zustand (client state)
- **AI**: OpenAI GPT-4o (captions, hashtags) + Claude (long-form) + DALL-E 3 / Flux (images)
- **Social APIs**: Direct (Instagram/Facebook Graph API, LinkedIn) + Ayrshare (Twitter, Pinterest, TikTok)
- **Automation**: Make.com (scheduled batch generation, webhook integration)
- **Payments**: Stripe (subscriptions)
- **PWA**: @ducanh2912/next-pwa (installable on desktop + mobile)

## Architecture
- **Multi-tenant**: Organizations → Workspaces (1 per brand) → Posts, Campaigns, Assets
- **Publisher abstraction**: Each platform has a `SocialPublisher` interface
- **AI pipeline**: Brand guidelines → layered prompts (voice + type + industry) → quality gate → output
- **Make.com integration**: Scenarios call app webhook → app generates → app publishes

## User Roles
- `owner`: Full org control, billing, workspace creation
- `admin`: Manage workspaces, publish, approve content
- `editor`: Create/edit content, schedule posts
- `viewer`: Read-only dashboard access

## Naming Conventions
- Database: `snake_case`
- React components: `PascalCase`
- Files: `kebab-case.tsx` (pages use Next.js conventions)
- Hooks: `use-{name}.ts`
- Types: `PascalCase` interfaces

## Security Rules
- RLS on every Supabase table
- All API keys server-side only (never in client components)
- Rate limiting on all API routes (AI: 10/min, auth: 5/min, reads: 30/min)
- Input sanitization on all user inputs
- Webhook signature verification for Make.com

## Key Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx supabase start` — Local Supabase
- `npx supabase db push` — Push migrations
