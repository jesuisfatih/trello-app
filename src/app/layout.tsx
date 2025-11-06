import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO DROME TEAM - Project Management',
  description: 'Manage your team projects with Trello boards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const apiKey = 'cdbe8c337ddeddaa887cffff22dca575'

  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
        <script
          id="shopify-app-bridge"
          data-api-key={apiKey}
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        ></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
