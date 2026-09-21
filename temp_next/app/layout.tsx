import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Meal Prep App',
  description: 'Plan your weekly meals and prepare ingredients in advance',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#060a13]">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-[#00ff9d]">
              Loading...
            </div>
          }
        >
          <header className="glass-panel sticky top-0 z-50 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xl font-bold text-[#00ff9d] hover:text-[#00e68d] transition-colors neon-text-sm"
                >
                  <img
                    src="/favicon.svg"
                    alt="Weekly Meal Prep Planner logo"
                    className="h-8 w-8 object-contain"
                  />

                  <span>Weekly Meal Prep Planner</span>
                </Link>

                <nav className="flex items-center gap-3">
                  <Link
                    href="/plans"
                    className="text-[#f0f4f8] hover:text-[#00ff9d] px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[rgba(0,255,157,0.1)]"
                  >
                    Plans
                  </Link>

                  <Link
                    href="/saved-dishes"
                    className="text-[#f0f4f8] hover:text-[#00d2ff] px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[rgba(0,210,255,0.1)]"
                  >
                    Saved Dishes
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          <main className="min-h-screen bg-gradient-radial">
            {children}
          </main>
        </Suspense>
      </body>
    </html>
  )
}