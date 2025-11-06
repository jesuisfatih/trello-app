import { NextRequest, NextResponse } from 'next/server';

/**
 * App installation entry point
 * Redirects to OAuth flow
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  if (!shop) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Install ShopiTrello</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   max-width: 500px; margin: 100px auto; padding: 20px; }
            input { width: 100%; padding: 10px; margin: 10px 0; font-size: 16px; }
            button { width: 100%; padding: 12px; background: #5469d4; color: white; 
                     border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
            button:hover { background: #4559c4; }
          </style>
        </head>
        <body>
          <h1>Install ShopiTrello</h1>
          <form action="/api/shopify/install" method="get">
            <input type="text" name="shop" placeholder="your-store.myshopify.com" required />
            <button type="submit">Install App</button>
          </form>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Redirect to OAuth
  const authUrl = new URL('/api/shopify/auth', process.env.SHOPIFY_APP_URL);
  authUrl.searchParams.set('shop', shop);
  if (host) {
    authUrl.searchParams.set('host', host);
  }

  return NextResponse.redirect(authUrl);
}

