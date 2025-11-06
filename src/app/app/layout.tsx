'use client'

import { ReactNode } from 'react'
import Script from 'next/script'

// Context Imports
import { AppBridgeProvider } from '@/lib/app-bridge-provider'
import { ToastProvider } from '@/ui/components/Toast'
import { ModalProvider } from '@/ui/components/Modal'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        strategy="beforeInteractive"
      />
      <ErrorBoundary>
        <AppBridgeProvider>
          <ToastProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </ToastProvider>
        </AppBridgeProvider>
      </ErrorBoundary>
    </>
  )
}
