'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AppBridgeConfig {
  apiKey: string;
  host: string;
  forceRedirect?: boolean;
}

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
        // Wait for App Bridge script to load
        if (typeof window === 'undefined' || !(window as any).shopify) {
          await new Promise((resolve) => {
            const checkShopify = setInterval(() => {
              if ((window as any).shopify) {
                clearInterval(checkShopify);
                resolve(true);
              }
            }, 100);
          });
        }

        const shopifyApp = (window as any).shopify;
        
        if (!shopifyApp) {
          throw new Error('Shopify App Bridge not loaded');
        }

        // Get config from URL params (Shopify provides these)
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

        if (!apiKey) {
          throw new Error('Shopify API key not configured');
        }

        if (!host) {
          console.warn('Host parameter missing, app may not work correctly in Shopify admin');
        }

        // App Bridge is initialized automatically via script
        setApp(shopifyApp);
        
        // Get initial session token
        if (shopifyApp.idToken) {
          const token = await shopifyApp.idToken();
          setSessionToken(token);
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
    if (!app || !app.idToken) {
      console.error('App Bridge not initialized');
      return null;
    }

    try {
      const token = await app.idToken();
      setSessionToken(token);
      return token;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
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
    if (app && app.toast) {
      app.toast.show(message, { isError, duration: 3000 });
    } else {
      // Fallback for development
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

