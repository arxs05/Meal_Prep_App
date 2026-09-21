import Link from 'next/link'
import { SparklesIcon } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 pb-24 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(0,255,157,0.1)] neon-glow-sm">
            <SparklesIcon className="w-8 h-8 text-[#00ff9d]" />
          </div>
          <h1 className="text-5xl font-bold text-[#f0f4f8] mb-6 tracking-tight">
            Weekly Meal Prep Planner
          </h1>
          <p className="text-xl text-[#8b9bb4] mb-12 max-w-xl mx-auto">
            Plan your weekly meals and prepare ingredients in advance with our
            organized meal planning system.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/plan/new"
              className="relative group overflow-hidden h-[58px] px-[32px] rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] flex items-center gap-3"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#060a13] ml-auto">
                <svg
                  className="w-5 h-5 text-[#00ff9d]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              Create Weekly Plan
            </Link>
            
            <Link
              href="/plans"
              className="text-[#00d2ff] hover:text-[#00ff9d] transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span>Open existing plan</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}