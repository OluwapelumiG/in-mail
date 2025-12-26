import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'In-Mail - SMTP Trap Server',
  description: 'Self-hosted SMTP trap server dashboard',
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

