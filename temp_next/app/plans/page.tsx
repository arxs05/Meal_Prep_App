'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

interface PlanData {
  id: string;
  title: string;
  week_start_date: string;
}

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

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
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
        setPlans(plansData || []);
      }
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan? This will also delete all dishes associated with this plan.')) {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }

      // Delete dishes first (via cascade or manually)
      await supabase.from('dishes').delete().eq('plan_id', planId);
      
      // Delete the plan
      const { error } = await supabase
        .from('weekly_plans')
        .delete()
        .eq('id', planId)
        .eq('owner_id', session.user.id);

      if (error) {
        console.error('Failed to delete plan:', error);
      } else {
        setPlans(plans.filter(p => p.id !== planId));
      }
    }
  };

  const handleOpenPlan = async (planId: string) => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return;
    }

    const { data: plan } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('id', planId)
      .eq('owner_id', session.user.id)
      .single();

    if (plan) {
      router.push(`/plan/${planId}/workspace`);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">Loading plans...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Your Plans
            </h1>
            <Link
              href="/plan/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Plan
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No plans yet. Create your first weekly meal prep plan!</p>
              <Link
                href="/plan/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Weekly Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{plan.title || 'Weekly Plan'}</h3>
                    <p className="text-gray-600 mt-1">
                      Week starting {formatDate(plan.week_start_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenPlan(plan.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}