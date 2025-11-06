'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { Redirect } from '@shopify/app-bridge/actions';

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
        // Get config from URL (REQUIRED by Shopify)
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'cdbe8c337ddeddaa887cffff22dca575';

        // SHOPIFY REQUIREMENT: host parameter MUST exist
        if (!host) {
          // If no host, redirect to Shopify OAuth install
          const shopParam = urlParams.get('shop');
          if (shopParam) {
            // Redirect to OAuth install
            window.location.href = `/api/shopify/auth?shop=${shopParam}`;
            return;
          }
          
          // Cannot proceed without host or shop
          console.error('CRITICAL: No host or shop parameter. App must be accessed from Shopify Admin.');
          setError('App must be accessed from Shopify Admin. Please install the app first.');
          setLoading(false);
          return;
        }

        // Create App Bridge instance (Shopify official method)
        const shopifyApp = createApp({
          apiKey,
          host, // MUST be from URL parameter (Shopify provides it)
          forceRedirect: true,
        });

        setApp(shopifyApp);

        // Get initial session token using Shopify utilities
        try {
          const token = await getSessionToken(shopifyApp);
          if (token) {
            setSessionToken(token);
          } else {
            console.warn('Session token is empty - may need OAuth authorization');
          }
        } catch (tokenError: any) {
          console.error('Failed to get session token:', tokenError);
          
          // If authentication fails, redirect to Shopify OAuth
          if (tokenError.type === 'APP::ERROR::FAILED_AUTHENTICATION') {
            const redirect = Redirect.create(shopifyApp);
            redirect.dispatch(
              Redirect.Action.REMOTE,
              `/api/shopify/auth?host=${encodeURIComponent(host)}`
            );
            return;
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
    if (!app) {
      console.error('App Bridge not initialized');
      return null;
    }

    try {
      const token = await getSessionToken(app);
      if (token) {
        setSessionToken(token);
        return token;
      }
    } catch (error: any) {
      console.error('Failed to get session token:', error);
      
      // Handle authentication failure
      if (error.type === 'APP::ERROR::FAILED_AUTHENTICATION') {
        // Redirect to OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const host = urlParams.get('host');
        if (host) {
          const redirect = Redirect.create(app);
          redirect.dispatch(
            Redirect.Action.REMOTE,
            `/api/shopify/auth?host=${encodeURIComponent(host)}`
          );
        }
      }
    }

    return null;
  };

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getToken();
    
    if (!token) {
      throw new Error('No session token available - authentication required');
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
    if (app) {
      try {
        const { Toast } = require('@shopify/app-bridge/actions');
        const toastOptions = {
          message,
          duration: 3000,
          isError,
        };
        const toastNotice = Toast.create(app, toastOptions);
        toastNotice.dispatch(Toast.Action.SHOW);
      } catch (e) {
        console.log('Toast:', message);
      }
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
