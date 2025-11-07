'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { decodeHostParam, extractShopFromHost, normalizeShopDomain } from '@/lib/shop';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SHOPIFY_API_KEY = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'cdbe8c337ddeddaa887cffff22dca575';

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const getMeta = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const meta = document.head?.querySelector(`meta[name="${name}"]`);
  return meta?.getAttribute('content') || null;
};

const setMeta = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  let meta = document.head?.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head?.appendChild(meta);
  }
  meta.setAttribute('content', value);
};

const setClientCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  const isSecureContext = window.location.protocol === 'https:';
  const sameSite = isSecureContext ? 'None' : 'Lax';
  const secure = sameSite === 'None' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=${sameSite}${secure}`;
};

interface AppBridgeContextType {
  app: any;
  loading: boolean;
  error: string | null;
  sessionToken: string | null;
  getSessionToken: () => Promise<string | null>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showToast: (message: string, isError?: boolean) => void;
  describeTrelloEvent: (event: any) => string | null;
}

const AppBridgeContext = createContext<AppBridgeContextType | null>(null);

export function AppBridgeProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const latestEventTimestampRef = useRef<number>(0);

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

        let shopFromContext = normalizeShopDomain(shopFromUrl);
        if (shopFromContext) {
          setClientCookie('shopify_shop', shopFromContext);
        }

        const waitForShopContext = async (): Promise<{ host: string | null; shop: string | null }> => {
          let attempts = 0;
          let hostCandidate: string | null =
            hostFromUrl ||
            getCookie('shopify_host') ||
            getMeta('shopify-host') ||
            null;

          let shopCandidate: string | null =
            shopFromContext ||
            normalizeShopDomain(getCookie('shopify_shop')) ||
            normalizeShopDomain(
              (getMeta('shopify-shop') || '')
                .replace(/^https?:\/\//, '')
            ) ||
            null;

          while ((!hostCandidate || !shopCandidate) && attempts < 60) {
            if (!hostCandidate) {
              hostCandidate =
                getCookie('shopify_host') ||
                getMeta('shopify-host') ||
                null;
            }

            if (!shopCandidate) {
              const shopCookie = getCookie('shopify_shop');
              if (shopCookie) {
                const normalized = normalizeShopDomain(shopCookie);
                if (normalized) {
                  shopCandidate = normalized;
                }
              }
            }

            if (!shopCandidate && hostCandidate) {
              const decodedHost = decodeHostParam(hostCandidate);
              const fromHost = extractShopFromHost(decodedHost);
              if (fromHost) {
                shopCandidate = fromHost;
                setClientCookie('shopify_shop', fromHost);
              }
            }

            if (hostCandidate && shopCandidate) {
              break;
            }

            attempts += 1;
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          return { host: hostCandidate, shop: shopCandidate };
        };

        const { host, shop } = await waitForShopContext();

        if (!host || !shop) {
          console.warn('Shopify host or shop parameter missing. App Bridge cannot initialise.');
          setLoading(false);
          return;
        }

        setClientCookie('shopify_host', host);
        setClientCookie('shopify_shop', shop);
        const shopForMeta = shop.startsWith('http') ? shop : `https://${shop}`;
        setMeta('shopify-shop', shopForMeta);
        setMeta('shopify-host', host);
        if (typeof document !== 'undefined' && document.body) {
          document.body.setAttribute('data-shopify-shop', shop);
        }

        const shopifyGlobal = (window as any).shopify;
        let appInstance = shopifyGlobal;

        if (shopifyGlobal?.createApp) {
          try {
            appInstance = shopifyGlobal.createApp({
              apiKey: SHOPIFY_API_KEY,
              host,
              shop,
              forceRedirect: true,
            });
            (window as any).__SHOPIFY_APP__ = appInstance;
          } catch (configError) {
            console.warn('Failed to create App Bridge via createApp:', configError);
          }
        } else if (shopifyGlobal?.config) {
          try {
            shopifyGlobal.config({
              apiKey: SHOPIFY_API_KEY,
              host,
              shop,
              forceRedirect: true,
            });
          } catch (configError) {
            console.warn('Failed to configure App Bridge via config:', configError);
          }
        } else {
          console.warn('Shopify App Bridge global object not ready yet.');
        }

        setApp(appInstance);

        // Get initial session token (CDN version does this automatically)
        const tokenSource = shopifyGlobal?.idToken || appInstance?.idToken;
        if (typeof tokenSource === 'function') {
          try {
            const token = await tokenSource.call(shopifyGlobal ?? appInstance);
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

  useEffect(() => {
    if (error) {
      return;
    }

    let intervalId: any;
    let cancelled = false;

    const fetchEvents = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const response = await fetch('/api/trello/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!Array.isArray(data.events)) {
          return;
        }

        if (latestEventTimestampRef.current === 0 && data.events.length > 0) {
          latestEventTimestampRef.current = new Date(data.events[0].createdAt).getTime();
          return;
        }

        const newEvents = data.events
          .filter((event: any) => {
            const ts = new Date(event.createdAt).getTime();
            return ts > latestEventTimestampRef.current;
          })
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (newEvents.length > 0) {
          latestEventTimestampRef.current = new Date(newEvents[newEvents.length - 1].createdAt).getTime();

          newEvents.forEach((event: any) => {
            const message = describeTrelloEvent(event);
            if (message) {
              showToast(message);
            }
          });
        }
      } catch (err) {
        console.warn('Failed to fetch Trello events:', err);
      }
    };

    const start = async () => {
      if (cancelled) return;
      await fetchEvents();
      if (cancelled) return;
      intervalId = setInterval(fetchEvents, 30000);
    };

    start();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const getToken = async (): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      const shopifyGlobal = (window as any).shopify;
      const appInstance = (window as any).__SHOPIFY_APP__ || app;

      const tokenSource =
        (shopifyGlobal && typeof shopifyGlobal.idToken === 'function' && shopifyGlobal.idToken) ||
        (appInstance && typeof appInstance.idToken === 'function' && appInstance.idToken);

      if (tokenSource) {
        try {
          const token = await tokenSource.call(shopifyGlobal ?? appInstance);
          if (token) {
            setSessionToken(token);
            return token;
          }
        } catch (error) {
          console.error('Failed to get session token:', error);
        }
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

  function describeTrelloEvent(event: any): string | null {
    const action = event?.payload?.action;
    if (!action) {
      return null;
    }

    const cardName = action.data?.card?.name || 'Card';
    const listName = action.data?.list?.name || action.data?.listAfter?.name;

    switch (action.type) {
      case 'createCard':
        return `🆕 Trello: "${cardName}" card created${listName ? ` in ${listName}` : ''}`;
      case 'updateCard': {
        if (action.data?.listBefore && action.data?.listAfter) {
          return `↔️ Trello: "${cardName}" moved from ${action.data.listBefore.name} to ${action.data.listAfter.name}`;
        }
        return `✏️ Trello: "${cardName}" was updated`;
      }
      case 'deleteCard':
        return `🗑️ Trello: "${cardName}" card deleted`;
      case 'commentCard':
        return `💬 Trello: New comment on "${cardName}"`;
      default:
        return null;
    }
  }

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
        describeTrelloEvent,
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
