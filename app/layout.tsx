import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EELU Smart Scheduling',
  description: 'Smart scheduling system for EELU',
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

