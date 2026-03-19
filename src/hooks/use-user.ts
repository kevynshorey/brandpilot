'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfile() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });
}

export function useOrganization() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data?.organizations ?? null;
    },
    enabled: !!user,
  });
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
}
