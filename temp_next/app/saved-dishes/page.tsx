'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PackageIcon, Trash2Icon } from 'lucide-react';

interface SavedDishIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: 'Mandatory' | 'Optional';
  notes?: string;
  assigned_to: string;
  is_prepared: boolean;
  preparation_form: string;
  sort_order: number;
}

interface SavedDish {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  ingredients: SavedDishIngredient[];
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown date';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unknown date';

  return `${date.getDate()} ${date.toLocaleString('default', {
    month: 'long',
  })} ${date.getFullYear()}`;
}

export default function SavedDishesPage() {
  const [savedDishes, setSavedDishes] = useState<SavedDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedDishes();
  }, []);

  const fetchSavedDishes = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setIsLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('saved_dishes')
      .select('id, name, notes, created_at')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch saved dishes:', fetchError);
      setError('Failed to load saved dishes. Please try again.');
    } else {
      const formattedDishes: SavedDish[] = (data || []).map((dish: any) => ({
        id: dish.id,
        name: dish.name,
        notes: dish.notes,
        created_at: dish.created_at,
        ingredients: [], // No longer fetching ingredients
      }));

      setSavedDishes(formattedDishes);
    }

    setIsLoading(false);
  };

  const handleDeleteDish = async (dishId: string, dishName: string) => {
    const confirmed = window.confirm(
      `Delete "${dishName}" from your saved templates? This will not affect existing weekly plans.`
    );

    if (!confirmed) return;

    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from('saved_dishes')
      .delete()
      .eq('id', dishId);

    if (deleteError) {
      console.error('Failed to delete saved dish:', deleteError);
      setError('Failed to delete template. Please try again.');
      return;
    }

    setSavedDishes((currentDishes) =>
      currentDishes.filter((dish) => dish.id !== dishId)
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#00ff9d]">
          <div className="w-5 h-5 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
          <span>Loading saved dishes...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f4f8]">Saved Dishes</h1>
            <p className="mt-2 text-[#8b9bb4]">Your saved dish templates</p>
          </div>

          <Link
            href="/plans"
            className="h-[44px] px-6 rounded-[300px] font-medium text-[#f0f4f8] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.12)] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Plans
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] rounded-lg text-[#fca5a5] text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {savedDishes.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(0,255,157,0.1)] flex items-center justify-center mx-auto mb-6 neon-glow-sm">
              <PackageIcon className="w-8 h-8 text-[#00ff9d]" />
            </div>
            <h2 className="text-xl font-semibold text-[#f0f4f8]">
              No saved dishes yet
            </h2>
            <p className="mt-2 text-[#8b9bb4] max-w-md mx-auto">
              Save a dish while creating your weekly plan to see it here as a reusable template.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedDishes.map((dish) => (
              <div
                key={dish.id}
                className="glass-card rounded-2xl p-6 group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-[#f0f4f8] group-hover:text-[#00ff9d] transition-colors">
                      {dish.name}
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-[rgba(0,255,157,0.1)] border border-[rgba(0,255,157,0.2)]">
                      <span className="text-[#00ff9d] text-xs font-medium uppercase tracking-wide">Template</span>
                    </span>
                  </div>

                  <p className="text-sm text-[#8b9bb4] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#00d2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(dish.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDish(dish.id, dish.name)}
                  className="h-[44px] px-5 rounded-[300px] font-medium text-[#f0f4f8] bg-[rgba(220,38,38,0.2)] border border-[rgba(220,38,38,0.3)] hover:bg-[rgba(220,38,38,0.3)] transition-all duration-300 flex items-center gap-2"
                >
                  <Trash2Icon className="w-4 h-4 text-[#fca5a5]" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#8b9bb4] hover:text-[#00ff9d] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}