'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const FALLBACK_TRELLO_API_KEY = '700a7218afc6cb86683668584a52645b'
const PLAN_DISPLAY_NAME = 'SEO DROME TEAM Premium'

type PlanKey = 'monthly' | 'annual'

interface BillingPlan {
  code: PlanKey
  name: string
  price: number
  interval: 'EVERY_30_DAYS' | 'ANNUAL'
  currencyCode: string
  description: string
}

interface SubscriptionSummary {
  id: string
  name: string
  status: string
  interval: string
  amount: number | null
  currencyCode: string | null
}

const FALLBACK_BILLING_PLANS: BillingPlan[] = [
  {
    code: 'monthly',
    name: `${PLAN_DISPLAY_NAME} Monthly`,
    price: 9.99,
    interval: 'EVERY_30_DAYS',
    currencyCode: 'USD',
    description: 'Billed every 30 days via Shopify Billing',
  },
  {
    code: 'annual',
    name: `${PLAN_DISPLAY_NAME} Annual`,
    price: Number((9.99 * 12 * 0.95).toFixed(2)),
    interval: 'ANNUAL',
    currencyCode: 'USD',
    description: 'Billed every 365 days with 5% discount',
  },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionSummary | null>(null)
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>(FALLBACK_BILLING_PLANS)
  const [billingStatusError, setBillingStatusError] = useState<string | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingActionLoading, setBillingActionLoading] = useState<PlanKey | null>(null)
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || FALLBACK_TRELLO_API_KEY

  useEffect(() => {
    async function initialize() {
      setLoading(true)
      try {
        await Promise.all([checkConnection(), loadBillingStatus()])
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  async function checkConnection() {
    try {
      const response = await fetch('/api/trello/status')
      const data = await response.json()
      
      if (data.connected && data.connection) {
        setConnected(true)
        
        // Get member info
        const memberUrl = `https://api.trello.com/1/members/me?key=${trelloApiKey}&token=${data.connection.token}`
        const memberResponse = await fetch(memberUrl)
        if (memberResponse.ok) {
          const member = await memberResponse.json()
          setMemberInfo(member)
        }
      }
    } catch (err) {
      console.error('Connection check failed:', err)
    }
  }

  async function loadBillingStatus() {
    try {
      setBillingStatusError(null)
      const response = await fetch('/api/shopify/billing', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setBillingStatusError(data.error || 'Unable to load billing status')
        return
      }

      const data = await response.json()
      setActiveSubscription(data.activeSubscription || null)
      if (Array.isArray(data.availablePlans) && data.availablePlans.length > 0) {
        const normalized = data.availablePlans
          .filter((plan: any) => plan && (plan.code === 'monthly' || plan.code === 'annual'))
          .map((plan: any) => ({
            code: plan.code as PlanKey,
            name: plan.name,
            price: plan.price,
            interval: plan.interval,
            currencyCode: plan.currencyCode,
            description: plan.description,
          })) as BillingPlan[]

        if (normalized.length > 0) {
          setAvailablePlans(normalized)
        }
      }
    } catch (err: any) {
      console.error('Billing status load failed:', err)
      setBillingStatusError(err.message || 'Unable to load billing status')
    }
  }

  async function handleStartPlan(plan: PlanKey) {
    try {
      setBillingError(null)
      setBillingActionLoading(plan)

      const response = await fetch('/api/shopify/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setBillingError(data.error || 'Failed to start subscription')
        return
      }

      const confirmationUrl = data.confirmationUrl
      if (!confirmationUrl) {
        setBillingError('Shopify did not return a confirmation URL')
        return
      }

      if (typeof window !== 'undefined') {
        const target = window.top ?? window
        target.location.href = confirmationUrl
      }
    } catch (err: any) {
      console.error('Billing start failed:', err)
      setBillingError(err.message || 'Failed to start subscription')
    } finally {
      setBillingActionLoading(null)
    }
  }

  const billingSuccess = searchParams.get('billing') === 'success'
  const billingSuccessPlan = (searchParams.get('plan') as PlanKey | null) || null
  const monthlyPlan = availablePlans.find((plan) => plan.code === 'monthly') || FALLBACK_BILLING_PLANS[0]
  const annualPlan = availablePlans.find((plan) => plan.code === 'annual') || FALLBACK_BILLING_PLANS[1]
  const hasActiveMonthly = Boolean(
    activeSubscription &&
      activeSubscription.interval === 'EVERY_30_DAYS' &&
      activeSubscription.status === 'ACTIVE'
  )
  const hasActiveAnnual = Boolean(
    activeSubscription &&
      activeSubscription.interval === 'ANNUAL' &&
      activeSubscription.status === 'ACTIVE'
  )

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Trello?')) {
      return
    }

    try {
      const response = await fetch('/api/trello/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        setConnected(false)
        setMemberInfo(null)
      }
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      <Card className="border-blue-200 bg-blue-50/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{PLAN_DISPLAY_NAME}</h2>
                <Badge variant="info">Single Plan</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Unlimited Trello sync, kanban automations and priority support crafted for Shopify merchants.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-500" />
                  <span>Drag & drop kanban with live Trello updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-500" />
                  <span>Manual token + OAuth 1.0a connection flows</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-500" />
                  <span>Audit logs, mappings and Trello webhooks included</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm uppercase tracking-wide text-gray-500">Monthly price</p>
            <p className="text-3xl font-bold text-gray-900">${monthlyPlan.price.toFixed(2)}</p>
            <p className="text-xs text-gray-500">USD, billed every 30 days through Shopify Billing</p>
          </div>
        </div>

        {billingSuccess && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Shopify billing confirmation received</p>
                <p className="mt-1">
                  {billingSuccessPlan === 'annual' ? 'Annual plan (5% savings)' : 'Monthly plan'} activated.
                  If Shopify still shows a pending charge, it will finalize shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {billingStatusError && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {billingStatusError}
          </div>
        )}

        {activeSubscription ? (
          <div className="mt-4 rounded-lg border border-green-200/70 bg-green-50/70 p-4 text-sm text-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Active subscription detected</p>
                <p className="mt-1">
                  {activeSubscription.name} · {activeSubscription.status}
                </p>
                <p className="text-xs text-green-700">
                  {activeSubscription.interval === 'ANNUAL' ? 'Annual billing' : 'Monthly billing'} ·{' '}
                  {activeSubscription.currencyCode || 'USD'}{' '}
                  {activeSubscription.amount !== null ? Number(activeSubscription.amount).toFixed(2) : '--'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            No active Shopify subscription yet. Choose a billing option below to unlock premium features.
          </p>
        )}

        {billingError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4" />
            <span>{billingError}</span>
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Button
            onClick={() => handleStartPlan('monthly')}
            isLoading={billingActionLoading === 'monthly'}
            disabled={billingActionLoading !== null || hasActiveMonthly}
            className="w-full"
            variant="primary"
            size="lg"
          >
            {hasActiveMonthly
              ? 'Monthly plan active'
              : `Activate Monthly · $${monthlyPlan.price.toFixed(2)}/mo`}
          </Button>
          <Button
            onClick={() => handleStartPlan('annual')}
            isLoading={billingActionLoading === 'annual'}
            disabled={billingActionLoading !== null || hasActiveAnnual}
            className="w-full"
            variant="outline"
            size="lg"
          >
            {hasActiveAnnual
              ? 'Annual plan active'
              : `Activate Annual · $${annualPlan.price.toFixed(2)}/yr (Save 5%)`}
          </Button>
        </div>
      </Card>

      {/* API Status */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Connections</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-900">Shopify</span>
              <p className="text-sm text-gray-500">Connected via Shopify App</p>
            </div>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-900">Trello</span>
              {connected && memberInfo ? (
                <p className="text-sm text-gray-500">
                  {memberInfo.fullName || memberInfo.username}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
            {connected ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">Connected</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Link href="/app/integrations/trello">
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Info</h2>
        <div className="space-y-2">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">API Version</span>
            <span className="font-medium text-gray-900">2026-01</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Environment</span>
            <span className="font-medium text-gray-900">Production</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
