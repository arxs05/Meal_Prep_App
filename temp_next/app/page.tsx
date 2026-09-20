import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Weekly Meal Prep Planner
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Plan your weekly meals and prepare ingredients in advance.
          </p>
          
          <div className="flex flex-col gap-4">
            <Link
              href="/plan/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Weekly Plan
            </Link>
            
            <Link
              href="/plans"
              className="text-blue-600 hover:text-blue-800"
            >
              Open existing plan
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}