import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Property Listings',
  description: 'Find your dream property with our comprehensive listings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <header className="bg-white shadow">
            <nav className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold">Property Listings</h1>
            </nav>
          </header>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-4">
            <div className="max-w-7xl mx-auto text-center">
              &copy; {new Date().getFullYear()} Your Company. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}