import { shopifyApi, Session, LogSeverity } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Build-time check is optional (env vars loaded at runtime)
const apiKey = process.env.SHOPIFY_API_KEY || 'placeholder';
const apiSecret = process.env.SHOPIFY_API_SECRET || 'placeholder';

export const shopify = shopifyApi({
  apiKey,
  apiSecretKey: apiSecret,
  scopes: (process.env.SHOPIFY_SCOPES || '').split(','),
  hostName: new URL(process.env.SHOPIFY_APP_URL || 'https://app.example.com').hostname,
  hostScheme: 'https',
  apiVersion: (process.env.SHOPIFY_API_VERSION as any) || '2026-01',
  isEmbeddedApp: true,
  logger: {
    level: process.env.NODE_ENV === 'production' ? LogSeverity.Warning : LogSeverity.Debug,
    httpRequests: process.env.NODE_ENV !== 'production',
    timestamps: true,
  },
});

export async function validateSessionToken(token: string): Promise<any> {
  try {
    const payload = await shopify.session.decodeSessionToken(token);
    return payload;
  } catch (error) {
    console.error('Session token validation failed:', error);
    throw new Error('Invalid session token');
  }
}

export async function exchangeToken(
  shop: string,
  sessionToken: string,
  requestedTokenType: 'online' | 'offline' = 'online'
): Promise<string> {
  const url = `https://${shop}/admin/oauth/access_token`;
  
  const body = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    client_secret: process.env.SHOPIFY_API_SECRET!,
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    subject_token: sessionToken,
    subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
    requested_token_type: `urn:shopify:params:oauth:token-type:${requestedTokenType}-access-token`,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function graphqlRequest(
  shop: string,
  accessToken: string,
  query: string,
  variables?: Record<string, any>
) {
  const client = new shopify.clients.Graphql({
    session: {
      shop,
      accessToken,
    } as any,
  });

  try {
    const response = await client.request(query, { variables });
    return response;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

