'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { useAppBridge } from '@/lib/app-bridge-provider'

export const dynamic = 'force-dynamic'

const FALLBACK_TRELLO_API_KEY = '700a7218afc6cb86683668584a52645b'
const PLAN_DISPLAY_NAME = 'SEO DROME TEAM Premium'

type TrelloMode = 'single' | 'multi'

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
  const { authenticatedFetch, describeTrelloEvent } = useAppBridge()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionSummary | null>(null)
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>(FALLBACK_BILLING_PLANS)
  const [billingStatusError, setBillingStatusError] = useState<string | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingActionLoading, setBillingActionLoading] = useState<PlanKey | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(true)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [pollInterval, setPollInterval] = useState(30)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [trelloMode, setTrelloMode] = useState<'single' | 'multi'>('multi')
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState<string | null>(null)
  const [teamUsers, setTeamUsers] = useState<any[]>([])

  const modeOptions: Array<{ label: string; value: TrelloMode; description: string }> = [
    { label: 'Single user mode', value: 'single', description: 'Shared Trello account' },
    { label: 'Multi user mode', value: 'multi', description: 'Each staff member connects individually' },
  ]
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || FALLBACK_TRELLO_API_KEY

  useEffect(() => {
    async function initialize() {
      setLoading(true)
      try {
        await Promise.all([checkConnection(), loadBillingStatus(), loadNotificationPreferences(), loadTeamUsers()])
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  async function checkConnection() {
    try {
      const response = await authenticatedFetch('/api/trello/status')
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
      const response = await authenticatedFetch('/api/shopify/billing', {
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

  async function loadNotificationPreferences() {
    try {
      setNotificationLoading(true)
      setNotificationError(null)
      const response = await authenticatedFetch('/api/trello/preferences', {
        method: 'GET',
      })
      if (!response.ok) {
        return
      }
      const data = await response.json()
      if (typeof data.notify === 'boolean') {
        setNotifyEnabled(data.notify)
      }
      if (typeof data.pollIntervalSeconds === 'number') {
        setPollInterval(data.pollIntervalSeconds)
      }
      if (data.trelloMode === 'single' || data.trelloMode === 'multi') {
        setTrelloMode(data.trelloMode)
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  async function updateNotificationPreferences(preferences: { notify?: boolean; pollIntervalSeconds?: number; trelloMode?: 'single' | 'multi' }) {
    try {
      setNotificationSaving(true)
      setNotificationError(null)
      const response = await authenticatedFetch('/api/trello/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update notification settings')
      }

      const data = await response.json()
      if (typeof data.notify === 'boolean') {
        setNotifyEnabled(data.notify)
      }
      if (typeof data.pollIntervalSeconds === 'number') {
        setPollInterval(data.pollIntervalSeconds)
      }
      if (data.trelloMode === 'single' || data.trelloMode === 'multi') {
        setTrelloMode(data.trelloMode)
      }
    } catch (error: any) {
      console.error('Notification settings update failed:', error)
      setNotificationError(error.message || 'Failed to update notification settings')
    } finally {
      setNotificationSaving(false)
    }
  }

  async function loadTeamUsers() {
    try {
      setTeamLoading(true)
      setTeamError(null)
      const response = await authenticatedFetch('/api/trello/users', {
        method: 'GET',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load users')
      }
      const data = await response.json()
      setTeamUsers(Array.isArray(data.users) ? data.users : [])
      if (data.trelloMode === 'single' || data.trelloMode === 'multi') {
        setTrelloMode(data.trelloMode)
      }
    } catch (error: any) {
      console.error('Failed to load Trello users:', error)
      setTeamError(error.message || 'Failed to load team members')
    } finally {
      setTeamLoading(false)
    }
  }

  async function handleStartPlan(plan: PlanKey) {
    try {
      setBillingError(null)
      setBillingActionLoading(plan)

      const response = await authenticatedFetch('/api/shopify/billing', {
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
      const response = await authenticatedFetch('/api/trello/disconnect', {
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

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Trello Activity Alerts</h2>
            <p className="text-sm text-gray-500">Control in-admin notifications for Trello board activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${notifyEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              {notifyEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              disabled={notificationLoading || notificationSaving}
              onClick={() => updateNotificationPreferences({ notify: !notifyEnabled })}
              className={`flex items-center rounded-full border px-4 py-1 text-sm transition-colors ${
                notifyEnabled
                  ? 'border-green-200 bg-green-100 text-green-700 hover:bg-green-200'
                  : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${notificationSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {notificationSaving ? 'Saving...' : notifyEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
        {notificationError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {notificationError}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Polling interval</label>
            <select
              value={pollInterval}
              disabled={notificationLoading || notificationSaving}
              onChange={(event) => updateNotificationPreferences({ pollIntervalSeconds: Number(event.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 30, 60, 120, 180].map((value) => (
                <option key={value} value={value}>
                  {value} seconds
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">We recommend 30 seconds. Shorter intervals deliver alerts faster but may increase API usage.</p>
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-2">Alert examples</p>
            <ul className="space-y-1">
              <li>🆕 Trello card created</li>
              <li>↔️ Card moved between lists</li>
              <li>💬 New comment added</li>
              <li>🗑️ Card archived or deleted</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Connection mode</h3>
          <p className="text-xs text-gray-500 mb-3">
            In single-user mode, the store owner’s Trello account is shared with everyone. In multi-user mode, each staff member connects their own Trello account.
          </p>
          <div className="flex flex-wrap gap-3">
            {modeOptions.map((option) => {
              const active = trelloMode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={notificationSaving || notificationLoading}
                  onClick={() => updateNotificationPreferences({ trelloMode: option.value })}
                  className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  } ${notificationSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </button>
              )
            })}
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

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Trello Activity</h2>
            <p className="text-sm text-gray-500">
              {trelloMode === 'single'
                ? 'Single user mode is active. The store owner manages the shared Trello connection.'
                : 'Each staff member can connect their Trello account. Recent activity is shown below.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            isLoading={teamLoading}
            onClick={loadTeamUsers}
          >
            Refresh
          </Button>
        </div>
        {teamError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {teamError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trello member</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notifications</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {teamUsers.length === 0 && !teamLoading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={4}>
                    No team members have connected to Trello yet.
                  </td>
                </tr>
              ) : (
                teamUsers.map((user) => {
                  const latestEvent = user.latestEvent
                  const describedEvent = latestEvent ? describeTrelloEvent(latestEvent) : null
                  const eventMessage = latestEvent
                    ? `${describedEvent || 'Activity recorded'} · ${new Date(latestEvent.createdAt).toLocaleString()}`
                    : 'No recent activity'
                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">{user.email || user.sub || 'Unknown user'}</div>
                        <div className="text-xs text-gray-500">Role: {user.role}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.trelloMemberId ? (
                          <span className="text-gray-900">{user.trelloMemberId}</span>
                        ) : (
                          <span className="text-gray-400">Not connected</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.notify ? (
                          <Badge variant="success">Enabled</Badge>
                        ) : (
                          <Badge variant="default">Disabled</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="text-gray-600">{eventMessage}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
