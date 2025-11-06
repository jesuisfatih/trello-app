'use client'

import { ReactNode } from 'react'
import Script from 'next/script'

// MUI already provided in root layout, no need to re-wrap

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

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        strategy="beforeInteractive"
      />
      <ErrorBoundary>
        <SettingsProvider>
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
        </SettingsProvider>
      </ErrorBoundary>
    </>
  )
}
