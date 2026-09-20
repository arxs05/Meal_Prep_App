'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

interface PlanData {
  id: string;
  title: string;
  week_start_date: string;
}

export default function NewPlanPage() {
  const router = useRouter();
  const [weekStartDate, setWeekStartDate] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPlans, setExistingPlans] = useState<PlanData[]>([]);

  // Load existing plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }

      const { data: plansData, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch plans:', error);
      } else {
        setExistingPlans(plansData || []);
      }
    };

    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        setError('You must be logged in to create a plan');
        return;
      }

      const planData = {
        owner_id: session.user.id,
        title: title || 'Weekly Plan',
        week_start_date: weekStartDate,
      };

      const { data: plan, error } = await supabase
        .from('weekly_plans')
        .insert(planData)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      if (plan) {
        router.push(`/plan/${plan.id}/workspace`);
      }
    } catch (err) {
      setError('An error occurred while creating the plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create Weekly Plan
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="weekStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Week Start Date
              </label>
              <input
                type="date"
                id="weekStartDate"
                required
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Plan Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., September 16-22, 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Plan'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500 text-center">
            This is a local demo. No data is saved yet.
          </p>
        </div>
      </div>
    </main>
  );
}