import type { Metadata } from 'next'

// MUI Imports
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

// CSS Imports
import './globals.css'

export const metadata: Metadata = {
  title: 'ShopiTrello - Shopify × Trello Integration',
  description: 'Seamless Shopify and Trello integration for automated workflow management',
}

// Simple MUI theme - Server Component safe
const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6',
    },
  },
})

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
        <AppRouterCacheProvider>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
