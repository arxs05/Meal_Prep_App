'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

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
      .select(`
        id,
        name,
        notes,
        created_at,
        saved_dish_ingredients (
          id,
          name,
          quantity,
          unit,
          category,
          notes,
          assigned_to,
          is_prepared,
          preparation_form,
          sort_order
        )
      `)
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch saved dishes:', fetchError);
      setError('Failed to load saved dishes. Please try again.');
    } else {
      const formattedDishes: SavedDish[] = (data || []).map((dish: any) => ({
        ...dish,
        ingredients: dish.saved_dish_ingredients || [],
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
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-600">Loading saved dishes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Saved Dishes
            </h1>
            <p className="mt-2 text-gray-600">
              Your saved dish templates
            </p>
          </div>

          <Link
            href="/"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Plans
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {savedDishes.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No saved dishes yet
            </h2>
            <p className="mt-2 text-gray-600">
              Save a dish while creating your weekly plan to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {savedDishes.map((dish) => (
              <div
                key={dish.id}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {dish.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Saved on {formatDate(dish.created_at)}
                    </p>

                    {dish.notes && (
                      <p className="mt-2 text-gray-600">{dish.notes}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                    className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>

                <div>
                  <h3 className="mb-3 font-medium text-gray-900">
                    Ingredients
                  </h3>

                  {dish.ingredients.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No ingredients saved.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dish.ingredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className="rounded-md border border-gray-200 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {ingredient.name}
                            </span>

                            {ingredient.quantity && (
                              <span className="text-sm text-gray-600">
                                {ingredient.quantity} {ingredient.unit}
                              </span>
                            )}

                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              {ingredient.category}
                            </span>
                          </div>

                          {ingredient.preparation_form && (
                            <p className="mt-1 text-sm text-gray-600">
                              Preparation: {ingredient.preparation_form}
                            </p>
                          )}

                          {ingredient.assigned_to && (
                            <p className="mt-1 text-sm text-gray-600">
                              Assigned to: {ingredient.assigned_to}
                            </p>
                          )}

                          {ingredient.notes && (
                            <p className="mt-1 text-sm text-gray-600">
                              Notes: {ingredient.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}