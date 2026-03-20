-- Migration: Rename 'agency' plan to 'business' and update check constraint
-- Part of pricing tier update: Free $0, Starter $19, Pro $49, Business $99

-- First, update any existing rows that have 'agency' plan
update organizations set plan = 'business' where plan = 'agency';

-- Drop the old check constraint and add the new one
alter table organizations drop constraint if exists organizations_plan_check;
alter table organizations add constraint organizations_plan_check
  check (plan in ('free', 'starter', 'pro', 'business'));
