import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'

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
          {children}
        </Suspense>
      </body>
    </html>
  )
}
