-- ============================================
-- Saved Dishes Library Database Schema
-- ============================================

CREATE TABLE IF NOT EXISTS saved_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_dish_id UUID NOT NULL REFERENCES public.saved_dishes(id) ON DELETE CASCADE,
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
-- Add normalized_name to saved_dishes if it doesn't exist (for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_dishes' AND column_name = 'normalized_name'
  ) THEN
    ALTER TABLE saved_dishes ADD COLUMN normalized_name TEXT;
  END IF;
END $$;

-- Add sort_order to saved_dish_ingredients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_dish_ingredients' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE saved_dish_ingredients ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_dishes_owner_id ON saved_dishes(owner_id);
CREATE INDEX IF NOT EXISTS idx_saved_dishes_normalized_name ON saved_dishes(normalized_name);
CREATE INDEX IF NOT EXISTS idx_saved_dishes_owner_normalized ON saved_dishes(owner_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_saved_dish_ingredients_saved_dish_id ON saved_dish_ingredients(saved_dish_id);

-- Add unique constraint for duplicate prevention
ALTER TABLE saved_dishes ADD CONSTRAINT uq_saved_dishes_owner_normalized UNIQUE (owner_id, normalized_name);

-- Enable RLS
ALTER TABLE saved_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_dish_ingredients ENABLE ROW LEVEL SECURITY;
-- RLS Policies for saved_dishes
CREATE POLICY "Users can view their own saved dishes" ON saved_dishes FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert their own saved dishes" ON saved_dishes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own saved dishes" ON saved_dishes FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for saved_dish_ingredients
CREATE POLICY "Users can view their saved dish ingredients" ON saved_dish_ingredients FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM saved_dishes
    WHERE saved_dishes.id = saved_dish_ingredients.saved_dish_id
    AND saved_dishes.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert ingredients for their saved dishes" ON saved_dish_ingredients FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM saved_dishes
    WHERE saved_dishes.id = saved_dish_ingredients.saved_dish_id
    AND saved_dishes.owner_id = auth.uid()
  )
);


CREATE POLICY "Users can delete their saved dish ingredients" ON saved_dish_ingredients FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM saved_dishes
    WHERE saved_dishes.id = saved_dish_ingredients.saved_dish_id
    AND saved_dishes.owner_id = auth.uid()
  )
);
-- ============================================
-- End of Saved Dishes Schema Migration
-- ============================================