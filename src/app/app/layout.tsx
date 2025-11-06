'use client'

import { ReactNode } from 'react'
import Script from 'next/script'

export const dynamic = 'force-dynamic'

// MUI Imports
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@mui/material/styles'
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

// Theme Imports
import theme from '@core/theme'

// CSS Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

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
            <ThemeProvider theme={theme({ skin: 'default' }, 'light', 'ltr')}>
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
