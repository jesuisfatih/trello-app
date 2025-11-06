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
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || 'cdbe8c337ddeddaa887cffff22dca575';
  
  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
        <script 
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          suppressHydrationWarning
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
