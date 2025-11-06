import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ShopiTrello - Trello Integration for Shopify',
  description: 'Connect your Shopify store with Trello boards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
