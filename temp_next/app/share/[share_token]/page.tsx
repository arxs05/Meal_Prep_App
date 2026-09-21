'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ChevronRightIcon, AlertCircleIcon, CalendarIcon } from 'lucide-react';

const toTitleCase = (value: string) => {
  return value.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

interface PlanData {
  id: string;
  title: string;
  week_start_date: string;
  visibility: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: 'Mandatory' | 'Optional';
  notes?: string;
  assigned_to: string;
  is_prepared: boolean;
  preparation_form: string;
}

interface Dish {
  id: string;
  name: string;
  notes: string;
  day: string;
  ingredients: Ingredient[];
}

export default function SharePage({ params }: { params: { share_token: string } }) {
  const router = useRouter();

  const [plan, setPlan] = useState<PlanData>({
    id: '',
    title: '',
    week_start_date: '',
    visibility: 'private'
  });
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState('');
const [showFullPlan, setShowFullPlan] = useState(false);
const assignedPeople = Array.from(
  new Set(
    dishes
      .flatMap((dish) => dish.ingredients)
      .map((ingredient) => ingredient.assigned_to?.trim().toLowerCase())
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b));

const normalizedSelectedPerson = selectedPerson.trim().toLowerCase();

const visibleDishes = showFullPlan
  ? dishes
  : dishes
      .map((dish) => ({
        ...dish,
        ingredients: dish.ingredients.filter(
          (ingredient) =>
            ingredient.assigned_to?.trim().toLowerCase() ===
            normalizedSelectedPerson
        ),
      }))
      .filter((dish) => dish.ingredients.length > 0);

  // Helper function to format date as "20 September 2026"
  function formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  // Get day order for sorting (Monday = 0 through Sunday = 6)
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch plan by share token
  useEffect(() => {
    const fetchSharedPlan = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = getSupabaseClient();
        
        // Fetch plan by share_token where visibility = 'public'
        const { data: planData, error: planError } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('share_token', params.share_token)
          .eq('visibility', 'public')
          .single();
        
        if (planError || !planData) {
          setError('Plan not found or unavailable');
          setIsLoading(false);
          return;
        }
        
        setPlan(planData);
        
        // Fetch dishes for this plan
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .eq('plan_id', planData.id)
          .order('sort_order', { ascending: true });
        
        if (dishesError) {
          console.error('Failed to fetch dishes:', dishesError);
          setDishes([]);
        } else {
          // Fetch ingredients for each dish
          const dishesWithIngredients = await Promise.all(
            dishesData.map(async (dish) => {
              const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*')
                .eq('dish_id', dish.id)
                .order('sort_order', { ascending: true });
              
              if (ingredientsError) {
                console.error('Failed to fetch ingredients:', ingredientsError);
              }
              
              return {
                ...dish,
                ingredients: ingredientsData || []
              };
            })
          );
          
          setDishes(dishesWithIngredients);
        }
      } catch (err) {
        setError('Plan not found or unavailable');
        console.error('Error fetching shared plan:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedPlan();
  }, [params.share_token]);

  // Render error state
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 pb-24 animate-fade-in">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-[rgba(220,38,38,0.1)] flex items-center justify-center mx-auto mb-6 neon-glow-sm">
              <AlertCircleIcon className="w-10 h-10 text-[#fca5a5]" />
            </div>
            <h2 className="text-2xl font-bold text-[#f0f4f8] mb-4">Plan Not Found</h2>
            <p className="text-[#8b9bb4] mb-8 text-lg">The plan you are looking for does not exist or is no longer available.</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center h-[44px] px-8 rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)]"
              >
                Back to Home
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 pb-24 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(0,255,157,0.1)] animate-spin mb-6 neon-glow-sm">
              <svg className="w-8 h-8 text-[#00ff9d]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-[#8b9bb4] text-lg">Loading shared plan...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24 animate-fade-in bg-[#060a13]">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-[#f0f4f8]">
              {plan.title || 'Weekly Plan'}
            </h1>
          </div>
          <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[rgba(0,255,157,0.1)] flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-[#00ff9d]" />
              </div>
              <div>
                <p className="text-[#8b9bb4] text-sm">Week of</p>
                <p className="text-[#f0f4f8] font-medium">{formatDate(plan.week_start_date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Status Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[rgba(0,255,157,0.1)] text-[#00ff9d] border border-[rgba(0,255,157,0.2)]">
            Public View - Read Only
          </span>
        </div>

        {/* Personal Task View */}
<div className="glass-panel mb-8 rounded-2xl p-6">
  <div className="mb-4">
    <h2 className="text-xl font-semibold text-[#f0f4f8]">
      My Tasks
    </h2>
    <p className="mt-1 text-sm text-[#8b9bb4]">
      Select your name to see the ingredients assigned to you.
    </p>
  </div>

  <select
    value={selectedPerson}
    onChange={(event) => {
      setSelectedPerson(event.target.value);
      setShowFullPlan(false);
    }}
    className="w-full rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] px-4 py-3 text-[#f0f4f8] focus:border-[#00ff9d] focus:outline-none"
  >
    <option value="">Choose your name</option>
    {assignedPeople.map((person) => (
  <option key={person} value={person}>
    {person.charAt(0).toUpperCase() + person.slice(1)}
  </option>
))}
  </select>

  <button
    type="button"
    onClick={() => setShowFullPlan(!showFullPlan)}
    className="mt-4 text-sm font-medium text-[#00d2ff] hover:underline"
  >
    {showFullPlan ? 'View My Tasks' : 'View Full Weekly Plan'}
  </button>
</div>


        {/* Dishes by Day */}
        <div className="space-y-8">
          {dayOrder.map((day) => {
            const dayDishes = visibleDishes.filter((dish) => dish.day === day);
            if (dayDishes.length === 0) return null;

            return (
              <div key={day} className="glass-panel rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-[#f0f4f8] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[rgba(0,255,157,0.1)] flex items-center justify-center text-[#00ff9d] text-sm font-bold">
                    {day.charAt(0)}
                  </span>
                  {day}
                </h2>

                <div className="space-y-4">
                  {dayDishes.map((dish) => (
                    <div key={dish.id} className="border border-[rgba(255,255,255,0.1)] rounded-xl p-5 bg-[rgba(20,27,45,0.3)]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-[#f0f4f8] mb-2">{dish.name}</h3>
                          {dish.notes && (
                            <p className="text-[#8b9bb4] text-sm leading-relaxed">{dish.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Ingredients */}
                      {dish.ingredients.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                          <h4 className="text-sm font-medium text-[#00ff9d] mb-3">Ingredients</h4>
                          <div className="space-y-2">
                            {dish.ingredients.map((ingredient) => (
                              <div key={ingredient.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
                                <div className="flex-1 min-w-[100px]">
                                 <span className="text-[#f0f4f8]">
  {ingredient.preparation_form && (
    <span className="mr-1 text-[#f1f2f4]">
      {ingredient.preparation_form}
    </span>
  )}
  {ingredient.name}
</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-[#00ff9d] font-medium">{ingredient.quantity}</span>
                                  <span className="text-[#8b9bb4]">{ingredient.unit}</span>
                                  {ingredient.category === 'Optional' && (
                                    <span className="text-[#00d2ff] text-xs px-2 py-0.5 rounded border border-[rgba(0,210,255,0.3)]">
                                      Optional
                                    </span>
                                  )}
                                  {ingredient.assigned_to && (
                                    <span className="text-[#f0f4f8] text-xs whitespace-nowrap">
                                      for {ingredient.assigned_to}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Back Link */}
        <div className="mt-12 text-center">
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