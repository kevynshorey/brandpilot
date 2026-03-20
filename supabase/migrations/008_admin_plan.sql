-- Add 'admin' and 'business' to allowed plan values
-- (original constraint only had: free, starter, pro, agency)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'business', 'agency', 'admin'));

-- Set Kevyn's org to admin plan (find by owner email)
UPDATE organizations
SET plan = 'admin'
WHERE owner_id = (
  SELECT id FROM auth.users
  WHERE email = 'kevynshorey@gmail.com'
  LIMIT 1
);
