'use client'

// React Imports
import { ReactNode } from 'react'

// Next Imports
import Script from 'next/script'

// Component Imports
import LayoutWrapper from '@layouts/LayoutWrapper'
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

// MUI Imports
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

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
      <ErrorBoundary>
        <SettingsProvider>
          <ThemeProvider theme={theme()}>
            <CssBaseline />
            <AppBridgeProvider>
              <ToastProvider>
                <ModalProvider>
                  <VerticalNavProvider>
                    <LayoutWrapper
                      verticalLayout={
                        <VerticalLayout
                          navigation={<Navigation />}
                          navbar={<Navbar />}
                          footer={<Footer />}
                        >
                          {children}
                        </VerticalLayout>
                      }
                    />
                  </VerticalNavProvider>
                </ModalProvider>
              </ToastProvider>
            </AppBridgeProvider>
          </ThemeProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </>
  )
}
