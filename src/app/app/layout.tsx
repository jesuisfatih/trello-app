'use client';

import Script from 'next/script';
import { AppBridgeProvider } from '@/lib/app-bridge-provider';
import { ToastProvider } from '@/ui/components/Toast';
import { ModalProvider } from '@/ui/components/Modal';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              <div className="app-wrapper">
                {children}
              </div>
            </ModalProvider>
          </ToastProvider>
        </AppBridgeProvider>
      </ErrorBoundary>
    </>
  );
}

