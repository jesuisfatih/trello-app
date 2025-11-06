import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    if (!shop || !shop.endsWith('.myshopify.com')) {
      return NextResponse.json({ error: 'Invalid shop parameter' }, { status: 400 });
    }

    // Build OAuth URL with comprehensive scopes
    const scopes = process.env.SHOPIFY_SCOPES || 
      'read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory,read_content,write_content';
    
    const redirectUrl = `https://${shop}/admin/oauth/authorize?${new URLSearchParams({
      client_id: process.env.SHOPIFY_API_KEY!,
      scope: scopes,
      redirect_uri: `${process.env.SHOPIFY_APP_URL}/api/shopify/auth/callback`,
      state: host || '',
      'grant_options[]': 'offline',
    })}`;

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
