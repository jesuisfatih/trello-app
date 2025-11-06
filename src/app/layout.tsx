import type { Metadata } from 'next'

// CSS Imports
import './globals.css'

export const metadata: Metadata = {
  title: 'ShopiTrello - Shopify × Trello Integration',
  description: 'Seamless Shopify and Trello integration for automated workflow management',
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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body className="flex is-full min-bs-full flex-auto flex-col">
        {children}
      </body>
    </html>
  )
}
