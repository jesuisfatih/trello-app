import { NextRequest, NextResponse } from 'next/server';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { TrelloClient } from '@/lib/trello';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TRELLO_API_KEY;
    const apiSecret = process.env.TRELLO_API_SECRET;
    const callbackUrl = process.env.TRELLO_OAUTH_CALLBACK_URL;
    const scope = process.env.TRELLO_DEFAULT_SCOPES || 'read,write';
    const expiration = process.env.TRELLO_TOKEN_EXPIRATION || 'never';

    if (!apiKey || !apiSecret || !callbackUrl) {
      return NextResponse.json(
        { error: 'Missing Trello OAuth configuration' },
        { status: 500 }
      );
    }

    const oauth = new OAuth({
      consumer: {
        key: apiKey,
        secret: apiSecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64');
      },
    });

    const requestData = {
      url: TrelloClient.getRequestTokenUrl(apiKey),
      method: 'POST',
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    // Get request token
    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to obtain request token');
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('Invalid request token response');
    }

    // Store token secret temporarily (in production, use Redis or session)
    // For now, we'll pass it as a state parameter (not recommended for production)
    const state = Buffer.from(JSON.stringify({
      secret: oauthTokenSecret,
      timestamp: Date.now(),
    })).toString('base64');

    // Build authorization URL
    const authorizeUrl = TrelloClient.getAuthorizeUrl(oauthToken, {
      name: 'ShopiTrello',
      scope,
      expiration,
      callbackUrl: `${callbackUrl}?state=${state}`,
    });

    return NextResponse.json({ authorizeUrl });
  } catch (error: any) {
    console.error('Trello OAuth start error:', error);
    return NextResponse.json(
      { error: error.message || 'OAuth initialization failed' },
      { status: 500 }
    );
  }
}

