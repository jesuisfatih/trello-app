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
        // Wait for App Bridge script to load (max 10 seconds)
        let attempts = 0;
        const maxAttempts = 100;
        
        while (typeof window !== 'undefined' && !(window as any).shopify && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (typeof window === 'undefined' || !(window as any).shopify) {
          console.warn('App Bridge script not loaded, continuing without it');
          setLoading(false);
          return;
        }

        const shopifyApp = (window as any).shopify;
        
        // Get config from URL params (Shopify provides these)
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'cdbe8c337ddeddaa887cffff22dca575';

        // Try to configure App Bridge if config method exists
        if (shopifyApp.config && host && apiKey) {
          try {
            shopifyApp.config({
              apiKey,
              host,
            });
          } catch (configError) {
            console.warn('App Bridge config failed:', configError);
          }
        }

        setApp(shopifyApp);
        
        // Get initial session token (with retry)
        if (shopifyApp.idToken) {
          try {
            const token = await Promise.race([
              shopifyApp.idToken(),
              new Promise<string | null>((resolve) => 
                setTimeout(() => resolve(null), 3000)
              )
            ]);
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
    // Try to get token from App Bridge
    if (app && app.idToken) {
      try {
        const token = await Promise.race([
          app.idToken(),
          new Promise<string | null>((resolve) => 
            setTimeout(() => resolve(null), 2000)
          )
        ]);
        if (token) {
          setSessionToken(token);
          return token;
        }
      } catch (error) {
        console.warn('Failed to get session token from App Bridge:', error);
      }
    }

    // Fallback: Try to get from window.shopify directly
    if (typeof window !== 'undefined' && (window as any).shopify?.idToken) {
      try {
        const token = await (window as any).shopify.idToken();
        if (token) {
          setSessionToken(token);
          setApp((window as any).shopify);
          return token;
        }
      } catch (error) {
        console.warn('Failed to get session token from window.shopify:', error);
      }
    }

    // If we have a cached token, return it
    if (sessionToken) {
      return sessionToken;
    }

    console.warn('No session token available');
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

