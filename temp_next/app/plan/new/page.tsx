'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CalendarIcon } from 'lucide-react';

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
  .insert({
    ...planData,
    visibility: 'private',
    share_token: crypto.randomUUID(),
  })
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
    <main className="min-h-screen flex items-center justify-center p-4 pb-24 animate-fade-in">
      <div className="container mx-auto px-4 max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[rgba(0,255,157,0.1)] flex items-center justify-center mb-4 neon-glow-sm">
              <CalendarIcon className="w-7 h-7 text-[#00ff9d]" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f4f8]">Create Weekly Plan</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] rounded-lg text-[#fca5a5] text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="weekStartDate" className="block text-sm font-medium text-[#f0f4f8] mb-2">
                Week Start Date
              </label>
              <input
                type="date"
                id="weekStartDate"
                required
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="w-full px-4 py-3 glass-input rounded-lg text-[#f0f4f8] transition-all focus:ring-2 focus:ring-[rgba(0,255,157,0.3)]"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[#f0f4f8] mb-2">
                Plan Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., September 16-22, 2026"
                className="w-full px-4 py-3 glass-input rounded-lg text-[#f0f4f8] placeholder-[#8b9bb4] transition-all focus:ring-2 focus:ring-[rgba(0,255,157,0.3)]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[58px] rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#060a13] border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-5 h-5" />
                  Create Plan
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-[#8b9bb4] text-center">
            Welcome to your new week !
          </p>
        </div>
      </div>
    </main>
  );
}