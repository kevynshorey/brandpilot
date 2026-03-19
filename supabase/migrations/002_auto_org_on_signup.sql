-- Auto-create organization and membership when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Create default organization
  insert into public.organizations (id, name, slug, owner_id, plan)
  values (
    gen_random_uuid(),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Organization',
    replace(lower(split_part(new.email, '@', 1)), '.', '-') || '-org',
    new.id,
    'free'
  )
  returning id into new_org_id;

  -- Add user as owner member
  insert into public.org_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger (drop first if exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fix: for existing users who signed up before this trigger, create their org now
do $$
declare
  u record;
  new_org_id uuid;
begin
  for u in
    select id, email, raw_user_meta_data from auth.users
    where id not in (select user_id from public.org_members)
  loop
    -- Create profile if missing
    insert into public.profiles (id, full_name)
    values (u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)))
    on conflict (id) do nothing;

    -- Create org
    insert into public.organizations (id, name, slug, owner_id, plan)
    values (
      gen_random_uuid(),
      coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) || '''s Organization',
      replace(lower(split_part(u.email, '@', 1)), '.', '-') || '-org-' || substr(u.id::text, 1, 8),
      u.id,
      'free'
    )
    returning id into new_org_id;

    -- Add membership
    insert into public.org_members (org_id, user_id, role)
    values (new_org_id, u.id, 'owner');
  end loop;
end;
$$;
