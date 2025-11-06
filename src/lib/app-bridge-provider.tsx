'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import createApp from '@shopify/app-bridge';

interface AppBridgeContextType {
  app: any;
  loading: boolean;
  error: string | null;
  sessionToken: string | null;
  getSessionToken: () => Promise<string | null>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showToast: (message: string, isError?: boolean) => void;
}

const AppBridgeContext = createContext<AppBridgeContextType | null>(null);

export function AppBridgeProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const initAppBridge = async () => {
      try {
        // Get config from URL (Shopify provides host parameter)
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'cdbe8c337ddeddaa887cffff22dca575';

        if (!host) {
          console.warn('Host parameter missing - app may not work in Shopify admin');
          setLoading(false);
          return;
        }

        // Create App Bridge instance (Shopify official method)
        const shopifyApp = createApp({
          apiKey,
          host,
          forceRedirect: true,
        });

        setApp(shopifyApp);

        // Get initial session token
        if (shopifyApp) {
          try {
            // Import getSessionToken from App Bridge utilities
            const { getSessionToken: getBridgeToken } = await import('@shopify/app-bridge/utilities');
            const token = await getBridgeToken(shopifyApp);
            if (token) {
              setSessionToken(token);
            }
          } catch (tokenError) {
            console.warn('Failed to get initial session token:', tokenError);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('App Bridge initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initAppBridge();
  }, []);

  const getSessionToken = async (): Promise<string | null> => {
    if (!app) {
      console.warn('App Bridge not initialized');
      return null;
    }

    try {
      const { getSessionToken: getBridgeToken } = await import('@shopify/app-bridge/utilities');
      const token = await getBridgeToken(app);
      if (token) {
        setSessionToken(token);
        return token;
      }
    } catch (error) {
      console.error('Failed to get session token:', error);
    }

    return null;
  };

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getSessionToken();
    
    if (!token) {
      throw new Error('No session token available');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    return fetch(url, {
      ...options,
      headers,
    });
  };

  const showToast = (message: string, isError: boolean = false) => {
    if (app && app.dispatch) {
      // Use App Bridge Toast action
      const Toast = app.Toast || {};
      if (Toast.create) {
        const toastOptions = {
          message,
          duration: 3000,
          isError,
        };
        Toast.create(app, toastOptions).dispatch(Toast.Action.SHOW);
      }
    } else {
      if (isError) {
        console.error('Toast:', message);
      } else {
        console.log('Toast:', message);
      }
    }
  };

  return (
    <AppBridgeContext.Provider
      value={{
        app,
        loading,
        error,
        sessionToken,
        getSessionToken,
        authenticatedFetch,
        showToast,
      }}
    >
      {children}
    </AppBridgeContext.Provider>
  );
}

export function useAppBridge() {
  const context = useContext(AppBridgeContext);
  if (!context) {
    throw new Error('useAppBridge must be used within AppBridgeProvider');
  }
  return context;
}
