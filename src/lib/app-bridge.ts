/**
 * App Bridge utilities for client-side integration
 * 
 * App Bridge 4.x uses a script-based initialization approach
 * The script is loaded in the app layout and creates a global shopify object
 */

export interface ShopifyAppBridge {
  config: {
    apiKey: string;
    host: string;
  };
  idToken: () => Promise<string>;
  toast: {
    show: (message: string, options?: { duration?: number; isError?: boolean }) => void;
  };
  modal: {
    show: (url: string) => void;
    hide: () => void;
  };
}

declare global {
  interface Window {
    shopify?: ShopifyAppBridge;
  }
}

/**
 * Get the App Bridge instance from the global window object
 */
export function getAppBridge(): ShopifyAppBridge | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.shopify || null;
}

/**
 * Get the current session token from App Bridge
 */
export async function getSessionToken(): Promise<string | null> {
  const appBridge = getAppBridge();
  if (!appBridge) {
    console.warn('App Bridge not initialized');
    return null;
  }

  try {
    const token = await appBridge.idToken();
    return token;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper that automatically includes session token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const sessionToken = await getSessionToken();
  
  if (!sessionToken) {
    throw new Error('No session token available');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${sessionToken}`);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Show a toast notification
 */
export function showToast(message: string, isError: boolean = false) {
  const appBridge = getAppBridge();
  if (appBridge) {
    appBridge.toast.show(message, { isError, duration: 3000 });
  } else {
    // Fallback to console
    console.log(`Toast: ${message}`);
  }
}

