import type { Metadata } from 'next'
import Script from 'next/script'
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
  const apiKey = 'cdbe8c337ddeddaa887cffff22dca575';
  
  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
      </head>
      <body className="antialiased">
        <Script 
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js" 
          data-api-key={apiKey}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  )
}
