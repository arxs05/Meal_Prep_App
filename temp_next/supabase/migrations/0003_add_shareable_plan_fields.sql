-- ============================================
-- Add Shareable Plan Fields to weekly_plans
-- ============================================
-- This migration adds fields to support shareable weekly meal plans:
-- 1. visibility - Determines if plan is public or private
-- 2. share_token - Secure UUID for generating shareable URLs
--
-- PUBLIC ACCESS SECURITY:
-- - Plans with visibility = 'public' can be viewed by anyone with the share_token
-- - No authentication required for viewing public plans
-- - RLS policies check visibility = 'public' OR owner_id = auth.uid()
-- - Share token itself is not exposed in URLs (only the public view page uses it)
-- ============================================

-- Add visibility column with default 'private'
ALTER TABLE weekly_plans 
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';

-- Add constraint to ensure visibility is either 'public' or 'private'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_weekly_plans_visibility'
  ) THEN
    ALTER TABLE weekly_plans 
    ADD CONSTRAINT chk_weekly_plans_visibility 
    CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

-- Add share_token column with unique constraint
ALTER TABLE weekly_plans 
ADD COLUMN IF NOT EXISTS share_token UUID;

-- Set default value for existing rows (in case column was just added)
UPDATE weekly_plans 
SET share_token = gen_random_uuid() 
WHERE share_token IS NULL;

-- Add NOT NULL constraint to share_token
ALTER TABLE weekly_plans 
ALTER COLUMN share_token 
SET NOT NULL;

-- Add UNIQUE constraint to ensure each share_token is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_weekly_plans_share_token'
  ) THEN
    ALTER TABLE weekly_plans 
    ADD CONSTRAINT uq_weekly_plans_share_token 
    UNIQUE (share_token);
  END IF;
END $$;

-- ============================================
-- Additional RLS Policies for Public Access
-- ============================================
-- These policies allow public viewing of plans where visibility = 'public'
-- while still protecting owner data and preventing unauthorized edits

-- weekly_plans: Public can view if visibility = 'public' OR user is owner
DROP POLICY IF EXISTS "Public can view public plans" ON weekly_plans;
CREATE POLICY "Public can view public plans" ON weekly_plans
  FOR SELECT
  USING (visibility = 'public' OR auth.uid() = owner_id);

-- dishes: Public can view if the plan's visibility = 'public' OR user is owner
DROP POLICY IF EXISTS "Public can view dishes of public plans" ON dishes;
CREATE POLICY "Public can view dishes of public plans" ON dishes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = dishes.plan_id
      AND (weekly_plans.visibility = 'public' OR weekly_plans.owner_id = auth.uid())
    )
  );

-- ingredients: Public can view if the plan's visibility = 'public' OR user is owner
DROP POLICY IF EXISTS "Public can view ingredients of public plans" ON ingredients;
CREATE POLICY "Public can view ingredients of public plans" ON ingredients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = ingredients.dish_id
      AND EXISTS (
        SELECT 1 FROM weekly_plans
        WHERE weekly_plans.id = dishes.plan_id
        AND (weekly_plans.visibility = 'public' OR weekly_plans.owner_id = auth.uid())
      )
    )
  );