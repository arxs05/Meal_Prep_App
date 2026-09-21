'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CalendarIcon, Trash2Icon, ChevronRightIcon } from 'lucide-react';

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

// Helper function to calculate week end date
function getWeekEndDate(startDateString: string): string {
  if (!startDateString) return '';
  
  const startDate = new Date(startDateString);
  if (isNaN(startDate.getTime())) return '';
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const day = endDate.getDate();
  const month = endDate.toLocaleString('default', { month: 'long' });
  const year = endDate.getFullYear();
  
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#00ff9d]">
          <div className="w-5 h-5 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
          <span>Loading plans...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f4f8]">Your Plans</h1>
            <p className="text-[#8b9bb4] mt-1">Manage your weekly meal prep schedules</p>
          </div>
          <Link
            href="/plan/new"
            className="h-[58px] px-6 rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] flex items-center gap-2"
          >
            <span className="text-2xl font-bold leading-none">+</span>
            New Plan
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(0,255,157,0.1)] flex items-center justify-center mx-auto mb-6 neon-glow-sm">
              <CalendarIcon className="w-8 h-8 text-[#00ff9d]" />
            </div>
            <p className="text-[#8b9bb4] mb-6 text-lg">No plans yet. Create your first weekly meal prep plan!</p>
            <Link
              href="/plan/new"
              className="inline-flex items-center h-[58px] px-8 rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]"
            >
              Create Weekly Plan
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className="glass-card rounded-2xl p-6 hover:neon-glow-sm transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#f0f4f8] group-hover:text-[#00ff9d] transition-colors">
                      {plan.title || 'Weekly Plan'}
                    </h3>
                    <p className="text-[#8b9bb4] mt-1 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#00d2ff]" />
                      <span>{formatDate(plan.week_start_date)} - {getWeekEndDate(plan.week_start_date)}</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleOpenPlan(plan.id)}
                      className="h-[44px] px-6 rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] flex items-center gap-2"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">Open</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="h-[44px] px-5 rounded-[300px] font-medium text-[#f0f4f8] bg-[rgba(220,38,38,0.2)] border border-[rgba(220,38,38,0.3)] hover:bg-[rgba(220,38,38,0.3)] transition-all duration-300 flex items-center gap-2"
                    >
                      <Trash2Icon className="w-4 h-4 text-[#fca5a5]" />
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </div>
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