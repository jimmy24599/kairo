import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kairo AI Agent',
  description: 'Turn any idea into a working web app with AI. Build full-stack applications, landing pages, and MVPs instantly.',
  keywords: 'AI, web app builder, no-code, full-stack, Next.js, TypeScript',
  authors: [{ name: 'Kairo Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

