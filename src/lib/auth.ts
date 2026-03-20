import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createServiceClient } from '@supabase/supabase-js';

interface AuthResult {
  userId: string;
  email?: string;
}

/**
 * Extract the authenticated user from request cookies.
 * Returns null if not authenticated. Uses the anon key + cookie session.
 */
export async function getAuthUser(): Promise<AuthResult | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only in API routes
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return { userId: user.id, email: user.email ?? undefined };
}

/**
 * Verify a user belongs to a specific organization.
 * Uses service role key to bypass RLS for the membership check.
 */
export async function verifyOrgMembership(userId: string, orgId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return false;

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  // Check if user is a member of the org (via org_members table or owner_id)
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single();

  if (org?.owner_id === userId) return true;

  // Check org_members table
  const { count } = await supabase
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('user_id', userId);

  return (count ?? 0) > 0;
}

/**
 * Combined auth check: get user + verify org membership.
 * Returns the user if authorized, null otherwise.
 */
export async function authorizeForOrg(orgId: string): Promise<AuthResult | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const isMember = await verifyOrgMembership(user.userId, orgId);
  if (!isMember) return null;

  return user;
}

/**
 * Verify the authenticated user has access to a workspace.
 * Resolves workspace → org, then checks org membership.
 * Returns { user, orgId } if authorized, null otherwise.
 */
export async function authorizeForWorkspace(
  workspaceId: string,
): Promise<{ user: AuthResult; orgId: string } | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('org_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace?.org_id) return null;

  const isMember = await verifyOrgMembership(user.userId, workspace.org_id);
  if (!isMember) return null;

  return { user, orgId: workspace.org_id };
}
