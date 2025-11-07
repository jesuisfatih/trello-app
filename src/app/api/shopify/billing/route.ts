import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { APP_SUBSCRIPTION_CREATE, CURRENT_APP_INSTALLATION } from '@/lib/graphql-queries'
import { graphqlRequest, validateSessionToken } from '@/lib/shopify'
import { getShopDomainFromRequest } from '@/lib/shop'

type PlanKey = 'monthly' | 'annual'

const PLAN_NAME = process.env.APP_PLAN_NAME || 'SEO DROME TEAM Premium'
const PLAN_CURRENCY = 'USD'
const MONTHLY_PRICE = 9.99
const ANNUAL_PRICE = Number((MONTHLY_PRICE * 12 * 0.95).toFixed(2)) // 5% discount

const PLAN_DEFINITIONS: Record<PlanKey, {
  name: string
  price: number
  interval: 'EVERY_30_DAYS' | 'ANNUAL'
  description: string
}> = {
  monthly: {
    name: `${PLAN_NAME} Monthly`,
    price: MONTHLY_PRICE,
    interval: 'EVERY_30_DAYS',
    description: 'Billed every 30 days via Shopify Billing',
  },
  annual: {
    name: `${PLAN_NAME} Annual`,
    price: ANNUAL_PRICE,
    interval: 'ANNUAL',
    description: 'Billed every 365 days with 5% discount',
  },
}

interface SubscriptionSummary {
  id: string
  name: string
  status: string
  interval: 'EVERY_30_DAYS' | 'ANNUAL' | 'UNKNOWN'
  amount: number | null
  currencyCode: string | null
}

async function resolveShopDomain(request: NextRequest): Promise<{ shop: string; sessionTokenUsed: boolean }> {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7)
    const payload = await validateSessionToken(sessionToken)
    const dest = payload?.dest as string | undefined
    if (dest) {
      const shop = dest.replace(/^https?:\/\//, '')
      return { shop, sessionTokenUsed: true }
    }
  }

  const { shopDomain } = getShopDomainFromRequest({
    hostParam: request.cookies.get('shopify_host')?.value,
    shopParam: request.cookies.get('shopify_shop')?.value,
  })

  if (!shopDomain) {
    throw new Error('Unable to determine shop domain')
  }

  return { shop: shopDomain, sessionTokenUsed: false }
}

async function getOfflineAccessToken(shop: string) {
  const shopRecord = await prisma.shop.findUnique({
    where: { domain: shop },
  })

  if (!shopRecord || !shopRecord.accessTokenOffline) {
    throw new Error('Shop not installed or missing offline token')
  }

  return {
    accessToken: shopRecord.accessTokenOffline,
    shopId: shopRecord.id,
  }
}

function summarizeActiveSubscription(subscriptions: any[]): SubscriptionSummary | null {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return null
  }

  const first = subscriptions[0]
  if (!first) {
    return null
  }

  const lineItem = first.lineItems?.[0]
  const plan = lineItem?.plan

  const recurring = plan?.__typename === 'AppRecurringPricing' ? plan : null

  return {
    id: first.id,
    name: first.name,
    status: first.status,
    interval: recurring?.interval || 'UNKNOWN',
    amount: recurring?.price?.amount ?? null,
    currencyCode: recurring?.price?.currencyCode ?? null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { shop } = await resolveShopDomain(request)
    const { accessToken } = await getOfflineAccessToken(shop)

    const result = await graphqlRequest(shop, accessToken, CURRENT_APP_INSTALLATION)
    const subscriptions = (result as any)?.data?.currentAppInstallation?.activeSubscriptions ?? []
    const summary = summarizeActiveSubscription(subscriptions)

    return NextResponse.json({
      activeSubscription: summary,
      availablePlans: Object.entries(PLAN_DEFINITIONS).map(([key, value]) => ({
        code: key,
        name: value.name,
        price: value.price,
        interval: value.interval,
        currencyCode: PLAN_CURRENCY,
        description: value.description,
      })),
    })
  } catch (error: any) {
    console.error('Billing status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load billing status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { shop, sessionTokenUsed } = await resolveShopDomain(request)
    const { accessToken, shopId } = await getOfflineAccessToken(shop)

    const body = await request.json().catch(() => ({}))
    const planKey = (body.plan || 'monthly') as PlanKey

    if (!['monthly', 'annual'].includes(planKey)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const planDef = PLAN_DEFINITIONS[planKey]
    const returnUrlBase = process.env.SHOPIFY_APP_URL || `https://${shop}`
    const returnUrl = `${returnUrlBase}/app/settings?billing=success&plan=${planKey}`

    const variables = {
      name: planDef.name,
      returnUrl,
      test: process.env.SHOPIFY_BILLING_TEST === 'true' || process.env.NODE_ENV !== 'production',
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              interval: planDef.interval,
              price: {
                amount: planDef.price,
                currencyCode: PLAN_CURRENCY,
              },
            },
          },
        },
      ],
    }

    const response = await graphqlRequest(shop, accessToken, APP_SUBSCRIPTION_CREATE, variables)
    const data = (response as any)?.data?.appSubscriptionCreate

    if (!data) {
      throw new Error('Invalid response from Shopify billing API')
    }

    if (data.userErrors && data.userErrors.length > 0) {
      const message = data.userErrors.map((err: any) => err.message).join('; ')
      return NextResponse.json({ error: message }, { status: 422 })
    }

    const confirmationUrl = data.confirmationUrl
    if (!confirmationUrl) {
      throw new Error('Shopify did not return a confirmation URL')
    }

    await prisma.eventLog.create({
      data: {
        shopId,
        source: 'shopify',
        type: 'billing_subscription_create',
        payload: {
          plan: planKey,
          planName: planDef.name,
          interval: planDef.interval,
          price: planDef.price,
          currency: PLAN_CURRENCY,
          sessionTokenUsed,
        },
        status: 'success',
      },
    })

    return NextResponse.json({ confirmationUrl })
  } catch (error: any) {
    console.error('Billing create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start subscription' },
      { status: 500 }
    )
  }
}


