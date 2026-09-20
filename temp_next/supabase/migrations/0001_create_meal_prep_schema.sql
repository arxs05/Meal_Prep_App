-- ============================================
-- Meal Prep Planner Database Schema
-- ============================================
-- This migration creates and updates the following tables:
-- 1. weekly_plans - Stores weekly meal plans with owner reference
-- 2. dishes - Stores dishes for each weekly plan
-- 3. ingredients - Stores ingredients for each dish
--
-- Security: Row Level Security (RLS) is enabled on all tables
-- with policies that restrict access to the plan owner only.
-- ============================================

-- ============================================
-- 1. CREATE TABLES (if not exist)
-- ============================================

-- Create weekly_plans table
-- owner_id is added to reference the authenticated Supabase user
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  category TEXT NOT NULL CHECK (category IN ('Mandatory', 'Optional')),
  notes TEXT,
  assigned_to TEXT,
  is_prepared BOOLEAN NOT NULL DEFAULT false,
  preparation_form TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ADD MISSING COLUMNS (safe migration)
-- ============================================
-- These statements check if columns exist before adding them
-- to make the migration idempotent

-- Add owner_id to weekly_plans if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_plans' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE weekly_plans ADD COLUMN owner_id UUID;
    
    -- Update existing rows with a placeholder (this is a problem if there's no owner)
    -- In production, you would need to handle this case based on your data
    RAISE WARNING 'owner_id column added to weekly_plans. Existing rows need owner_id values.';
  END IF;
END $$;

-- Add sort_order to dishes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dishes' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE dishes ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add sort_order to ingredients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ingredients' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
-- Create indexes to improve query performance for common operations

CREATE INDEX IF NOT EXISTS idx_weekly_plans_owner_id ON weekly_plans(owner_id);
CREATE INDEX IF NOT EXISTS idx_dishes_plan_id ON dishes(plan_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_dish_id ON ingredients(dish_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
-- Create a function to update the updated_at timestamp on row modification

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to avoid duplicates)
DROP TRIGGER IF EXISTS update_weekly_plans_updated_at ON weekly_plans;
DROP TRIGGER IF EXISTS update_dishes_updated_at ON dishes;
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;

-- Create triggers for each table
CREATE TRIGGER update_weekly_plans_updated_at
  BEFORE UPDATE ON weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Remove existing permissive policies
DROP POLICY IF EXISTS "Allow all on weekly_plans" ON weekly_plans;
DROP POLICY IF EXISTS "Allow all on dishes" ON dishes;
DROP POLICY IF EXISTS "Allow all on ingredients" ON ingredients;

-- Create secure policies that restrict access to the plan owner only

-- weekly_plans policies
CREATE POLICY "Users can view their own plans" ON weekly_plans
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own plans" ON weekly_plans
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own plans" ON weekly_plans
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own plans" ON weekly_plans
  FOR DELETE
  USING (auth.uid() = owner_id);

-- dishes policies
CREATE POLICY "Users can view their plan's dishes" ON dishes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = dishes.plan_id
      AND weekly_plans.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dishes for their plans" ON dishes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = dishes.plan_id
      AND weekly_plans.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their plan's dishes" ON dishes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = dishes.plan_id
      AND weekly_plans.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their plan's dishes" ON dishes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = dishes.plan_id
      AND weekly_plans.owner_id = auth.uid()
    )
  );

-- ingredients policies
CREATE POLICY "Users can view their dish's ingredients" ON ingredients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = ingredients.dish_id
      AND EXISTS (
        SELECT 1 FROM weekly_plans
        WHERE weekly_plans.id = dishes.plan_id
        AND weekly_plans.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert ingredients for their dishes" ON ingredients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = ingredients.dish_id
      AND EXISTS (
        SELECT 1 FROM weekly_plans
        WHERE weekly_plans.id = dishes.plan_id
        AND weekly_plans.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their dish's ingredients" ON ingredients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = ingredients.dish_id
      AND EXISTS (
        SELECT 1 FROM weekly_plans
        WHERE weekly_plans.id = dishes.plan_id
        AND weekly_plans.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their dish's ingredients" ON ingredients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = ingredients.dish_id
      AND EXISTS (
        SELECT 1 FROM weekly_plans
        WHERE weekly_plans.id = dishes.plan_id
        AND weekly_plans.owner_id = auth.uid()
      )
    )
  );