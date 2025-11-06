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
  const appOrigin = process.env.SHOPIFY_APP_URL || 'https://trello-engine.dev'

  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
        <meta name="shopify-app-origin" content={appOrigin} />
        <meta name="shopify-shop-origin" content="" />
        <script
          id="shopify-meta-bootstrap"
          dangerouslySetInnerHTML={{
            __html: `
              (function bootstrapShopifyMeta() {
                if (typeof window === 'undefined') return;

                function getCookie(name) {
                  var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                  return match ? decodeURIComponent(match[2]) : null;
                }

                function ensureMeta(name, value) {
                  var meta = document.head.querySelector('meta[name=\"' + name + '\"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', name);
                    document.head.appendChild(meta);
                  }
                  if (typeof value === 'string' && value.length) {
                    meta.setAttribute('content', value);
                  }
                  return meta;
                }

                function decodeHost(hostParam) {
                  if (!hostParam) return null;
                  try {
                    var decoded = window.atob(hostParam);
                    return decoded || hostParam;
                  } catch (err) {
                    return hostParam;
                  }
                }

                function extractShop(hostParam) {
                  if (!hostParam) return null;
                  var decoded = decodeHost(hostParam);
                  if (!decoded) return null;
                  var match = decoded.match(/([a-z0-9][a-z0-9-]*\\.myshopify\\.com)/i);
                  return match ? match[1].toLowerCase() : null;
                }

                var params = new URLSearchParams(window.location.search);
                var hostParam = params.get('host') || getCookie('shopify_host');
                var shopParam = params.get('shop') || getCookie('shopify_shop');
                var shopDomain = null;

                if (shopParam && typeof shopParam === 'string') {
                  shopDomain = shopParam.trim().toLowerCase();
                }

                if (!shopDomain) {
                  shopDomain = extractShop(hostParam);
                }

                if (shopDomain && !shopDomain.startsWith('https://')) {
                  shopDomain = 'https://' + shopDomain.replace(/^https?:\\/\\//, '');
                }

                var appOrigin = window.location.origin;
                ensureMeta('shopify-app-origin', appOrigin);

                if (shopDomain) {
                  ensureMeta('shopify-shop-origin', shopDomain);
                  window.__SHOPIFY_SHOP_ORIGIN__ = shopDomain;
                  if (document.body) {
                    document.body.setAttribute('data-shopify-shop-origin', shopDomain);
                  } else {
                    document.addEventListener('DOMContentLoaded', function () {
                      if (document.body) {
                        document.body.setAttribute('data-shopify-shop-origin', shopDomain);
                      }
                    });
                  }
                }
              })();
            `,
          }}
        />
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
