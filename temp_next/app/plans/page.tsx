'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PlanData {
  id: string
  title: string
  weekStartDate: string
}

// Helper function to format date as "20 September 2026"
function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown date'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Unknown date'
  
  const day = date.getDate()
  const month = date.toLocaleString('default', { month: 'long' })
  const year = date.getFullYear()
  
  return `${day} ${month} ${year}`
}

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load plans from localStorage
    const storedPlans = localStorage.getItem('plans')
    if (storedPlans) {
      try {
        const plansData: PlanData[] = JSON.parse(storedPlans)
        // Sort by most recent (highest ID which is based on timestamp)
        const sortedPlans = plansData.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        setPlans(sortedPlans)
      } catch (e) {
        console.error('Failed to parse stored plans:', e)
      }
    }
    setIsLoading(false)
  }, [])

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan? This will also delete all dishes associated with this plan.')) {
      const storedPlans = localStorage.getItem('plans')
      if (storedPlans) {
        try {
          const plansData: PlanData[] = JSON.parse(storedPlans)
          const updatedPlans = plansData.filter(p => p.id !== planId)
          setPlans(updatedPlans)
          localStorage.setItem('plans', JSON.stringify(updatedPlans))
          
          // Also delete dishes for this plan
          localStorage.removeItem(`dishes_${planId}`)
        } catch (e) {
          console.error('Failed to delete plan:', e)
        }
      }
    }
  }

  const handleOpenPlan = (planId: string) => {
    // Set the current plan in localStorage for the workspace to use
    const storedPlans = localStorage.getItem('plans')
    if (storedPlans) {
      try {
        const plansData: PlanData[] = JSON.parse(storedPlans)
        const plan = plansData.find(p => p.id === planId)
        if (plan) {
          localStorage.setItem('currentPlan', JSON.stringify(plan))
          router.push(`/plan/${planId}/workspace`)
        }
      } catch (e) {
        console.error('Failed to open plan:', e)
      }
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">Loading plans...</p>
          </div>
        </div>
      </main>
    )
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
                      Week starting {formatDate(plan.weekStartDate)}
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
  )
}