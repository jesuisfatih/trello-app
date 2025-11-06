import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO DROME TEAM - Project Management',
  description: 'Manage your team projects with Trello boards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const apiKey = 'cdbe8c337ddeddaa887cffff22dca575'

  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
        <script
          id="shopify-app-bridge-loader"
          dangerouslySetInnerHTML={{
            __html: `
              (function loadShopifyAppBridge() {
                if (typeof window === 'undefined') return;
                if (window.__SHOPIFY_APP_BRIDGE_LOADING__) return;
                window.__SHOPIFY_APP_BRIDGE_LOADING__ = true;

                function injectScript() {
                  var existing = document.getElementById('shopify-app-bridge-script');
                  if (existing) {
                    window.__SHOPIFY_APP_BRIDGE_READY__ = true;
                    return;
                  }

                  var script = document.createElement('script');
                  script.id = 'shopify-app-bridge-script';
                  script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
                  script.async = false;
                  script.defer = false;
                  script.onload = function () {
                    window.__SHOPIFY_APP_BRIDGE_READY__ = true;
                    if (Array.isArray(window.ShopifyAppBridgeReadyCallbacks)) {
                      window.ShopifyAppBridgeReadyCallbacks.forEach(function (callback) {
                        try { callback(); } catch (err) { console.error('App Bridge callback failed', err); }
                      });
                    }
                  };
                  var head = document.head || document.getElementsByTagName('head')[0];
                  if (head.firstChild) {
                    head.insertBefore(script, head.firstChild);
                  } else {
                    head.appendChild(script);
                  }
                }

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', injectScript);
                } else {
                  injectScript();
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
