import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Weekly Meal Prep Planner',
  description: 'Plan your weekly meals and prepare ingredients in advance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <header className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link 
                  href="/"
                  className="text-xl font-bold text-gray-900 hover:text-gray-700"
                >
                  Weekly Meal Prep Planner
                </Link>
                <nav className="flex items-center gap-4">
                  <Link
                    href="/plans"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Plans
                  </Link>
                  <Link
                    href="/saved-dishes"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                  >
                    Saved Dishes
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main>
            {children}
          </main>
        </Suspense>
      </body>
    </html>
  )
}
