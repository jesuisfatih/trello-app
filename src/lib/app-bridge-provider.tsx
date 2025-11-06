'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { normalizeShopDomain } from '@/lib/shop';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SHOPIFY_API_KEY = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'cdbe8c337ddeddaa887cffff22dca575';

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const setClientCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
};

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
        // Wait for window.shopify (CDN script automatically initializes it)
        let attempts = 0;
        while (typeof window === 'undefined' || !(window as any).shopify) {
          if (attempts++ > 50) {
            console.warn('App Bridge CDN script not loaded');
            setLoading(false);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const urlParams = new URLSearchParams(window.location.search);
        const hostFromUrl = urlParams.get('host');
        const shopFromUrl = urlParams.get('shop');

        if (hostFromUrl) {
          setClientCookie('shopify_host', hostFromUrl);
        }

        if (shopFromUrl) {
          const normalizedShop = normalizeShopDomain(shopFromUrl);
          if (normalizedShop) {
            setClientCookie('shopify_shop', normalizedShop);
          }
        }

        const hostFromCookie = getCookie('shopify_host');
        const host = hostFromUrl || hostFromCookie;

        if (!host) {
          console.warn('Shopify host parameter missing. App Bridge cannot initialise.');
          setLoading(false);
          return;
        }

        if ((window as any).shopify?.config) {
          try {
            (window as any).shopify.config({
              apiKey: SHOPIFY_API_KEY,
              host,
              forceRedirect: true,
            });
          } catch (configError) {
            console.warn('Failed to configure App Bridge:', configError);
          }
        }

        const shopifyApp = (window as any).shopify;
        setApp(shopifyApp);

        // Get initial session token (CDN version does this automatically)
        if (shopifyApp.idToken) {
          try {
            const token = await shopifyApp.idToken();
            if (token) {
              setSessionToken(token);
              console.log('✅ Session token acquired successfully');
            }
          } catch (e) {
            console.warn('Session token not available yet:', e);
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

  const getToken = async (): Promise<string | null> => {
    // Try window.shopify directly (CDN provides this)
    if (typeof window !== 'undefined' && (window as any).shopify?.idToken) {
      try {
        const token = await (window as any).shopify.idToken();
        if (token) {
          setSessionToken(token);
          return token;
        }
      } catch (error) {
        console.error('Failed to get session token:', error);
      }
    }

    // Fallback to cached token
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
    const token = await getToken();
    
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
    if (app?.toast) {
      app.toast.show(message, { isError, duration: 3000 });
    } else {
      console.log('Toast:', message);
    }
  };

  return (
    <AppBridgeContext.Provider
      value={{
        app,
        loading,
        error,
        sessionToken,
        getSessionToken: getToken,
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
