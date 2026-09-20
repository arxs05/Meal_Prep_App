import './globals.css'
import type { Metadata } from 'next'

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
      <body>{children}</body>
    </html>
  )
}