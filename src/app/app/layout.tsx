'use client'

import { ReactNode } from 'react'
import Script from 'next/script'

// MUI Imports
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

// Component Imports
import VerticalLayout from '@layouts/VerticalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import Footer from '@components/layout/vertical/Footer'

// Context Imports
import { AppBridgeProvider } from '@/lib/app-bridge-provider'
import { ToastProvider } from '@/ui/components/Toast'
import { ModalProvider } from '@/ui/components/Modal'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'

// CSS Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Simple MUI theme (no complex Vuexy theme to avoid SSR issues)
const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6',
    },
    secondary: {
      main: '#8B5CF6',
    },
  },
  shape: {
    borderRadius: 6,
  },
})

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        strategy="beforeInteractive"
      />
      <AppRouterCacheProvider>
        <ErrorBoundary>
          <SettingsProvider>
            <ThemeProvider theme={muiTheme}>
              <CssBaseline />
              <AppBridgeProvider>
                <ToastProvider>
                  <ModalProvider>
                    <VerticalNavProvider>
                      <VerticalLayout
                        navigation={<Navigation />}
                        navbar={<Navbar />}
                        footer={<Footer />}
                      >
                        {children}
                      </VerticalLayout>
                    </VerticalNavProvider>
                  </ModalProvider>
                </ToastProvider>
              </AppBridgeProvider>
            </ThemeProvider>
          </SettingsProvider>
        </ErrorBoundary>
      </AppRouterCacheProvider>
    </>
  )
}
