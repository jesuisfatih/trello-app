import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Set security headers for all responses
  // Note: Caddy also sets these, but we ensure they're correct here
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors https://*.myshopify.com https://admin.shopify.com https://*.shopify.com;"
  );

  // Allow public routes
  const publicRoutes = [
    '/api/health',
    '/api/shopify/webhooks',
    '/api/trello/webhooks',
    '/api/trello/oauth/callback',
    '/api/shopify/auth',
    '/api/shopify/install',
  ];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  // For app routes, let App Bridge handle authentication
  if (pathname.startsWith('/app')) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

