'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, CheckCircle2, XCircle, ExternalLink, ShieldCheck, Lock, Tag } from 'lucide-react'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'
import { useAppBridge } from '@/lib/app-bridge-provider'

export const dynamic = 'force-dynamic'

const FALLBACK_TRELLO_API_KEY = '700a7218afc6cb86683668584a52645b'

type TrelloMode = 'single' | 'multi'

type ConnectionScope = 'user' | 'shared' | null

export default function TrelloIntegrationPage() {
  const router = useRouter()
  const { authenticatedFetch } = useAppBridge()
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [oauthLoading, setOauthLoading] = useState(false)
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || FALLBACK_TRELLO_API_KEY
  const [trelloMode, setTrelloMode] = useState<TrelloMode>('multi')
  const [canManageConnection, setCanManageConnection] = useState(true)
  const [connectionScope, setConnectionScope] = useState<ConnectionScope>(null)
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('owner')

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const response = await authenticatedFetch('/api/trello/status')
      const data = await response.json()

      setTrelloMode(data.mode === 'single' ? 'single' : 'multi')
      setCanManageConnection(data.canManage !== false)
      setConnectionScope(data.connection?.scope ?? null)
      if (data.user?.role === 'staff' || data.user?.role === 'owner') {
        setUserRole(data.user.role)
      }

      if (data.connected && data.connection) {
        setConnected(true)
        const memberUrl = `https://api.trello.com/1/members/me?key=${trelloApiKey}&token=${data.connection.token}`
        const memberResponse = await fetch(memberUrl)
        if (memberResponse.ok) {
          const member = await memberResponse.json()
          setMemberInfo(member)
        }
      } else {
        setConnected(false)
        setMemberInfo(null)
      }
    } catch (err) {
      console.error('Connection check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function ensureCanManage(action: string) {
    if (!canManageConnection) {
      setError(`Trello connection is managed by the store owner. Please ask them to ${action}.`)
      return false
    }
    return true
  }

  async function handleConnect() {
    if (!ensureCanManage('connect Trello')) {
      return
    }

    if (!token) {
      setError('Please enter your Trello token')
      return
    }

    if (!token.startsWith('ATTA')) {
      setError('Invalid token format. Trello tokens should start with "ATTA".')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const testUrl = `https://api.trello.com/1/members/me?key=${trelloApiKey}&token=${token}`

      const testResponse = await fetch(testUrl)

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('Invalid Trello token. Please check your token and try again.')
        }
        throw new Error(`Trello API error: ${testResponse.status}`)
      }

      const member = await testResponse.json()

      const saveResponse = await authenticatedFetch('/api/trello/connect/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          memberId: member.id,
          memberName: member.fullName || member.username,
        }),
      })

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save connection')
      }

      setConnected(true)
      setMemberInfo(member)
      setToken('')

      await checkConnection()
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Trello')
    } finally {
      setConnecting(false)
    }
  }

  async function handleOAuth1() {
    if (!ensureCanManage('connect Trello')) {
      return
    }

    setError(null)
    setOauthLoading(true)
    try {
      const response = await authenticatedFetch('/api/trello/oauth1/start', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok || !data.authorizeUrl) {
        throw new Error(data.error || 'Failed to initiate Trello OAuth')
      }

      window.open(data.authorizeUrl, '_top')
    } catch (err: any) {
      console.error('OAuth start failed:', err)
      setError(err.message || 'Failed to start Trello OAuth')
    } finally {
      setOauthLoading(false)
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Connect to Trello</h1>
        <p className="text-gray-600">Enter your Trello token to sync boards, lists, and cards</p>
      </div>

      <Card className="border-blue-200 bg-blue-50/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Tag className="h-5 w-5 text-blue-600" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Plan: SEO DROME TEAM Premium</h2>
                <Badge variant="info">$9.99 / month</Badge>
                <Badge variant={trelloMode === 'single' ? 'warning' : 'success'}>
                  {trelloMode === 'single' ? 'Single-user mode' : 'Multi-user mode'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Single pricing tier that unlocks Trello OAuth 1.0a, manual tokens, kanban automation and webhook syncing.
              </p>
              {trelloMode === 'single' && (
                <p className="mt-2 text-xs text-gray-500">
                  Trello connection is shared across the team. {userRole === 'owner' ? 'You can update it here.' : 'Only the store owner can update this connection.'}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Billed via Shopify</p>
            <p className="text-lg font-semibold text-gray-900">$9.99 USD</p>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {connected && memberInfo && (
        <Card className="border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Connected to Trello</h3>
                <p className="text-sm text-green-700">
                  Logged in as: {memberInfo.fullName || memberInfo.username}
                </p>
                {trelloMode === 'single' && connectionScope === 'shared' && (
                  <p className="text-xs text-green-700 mt-1">Shared Trello account for all Shopify users.</p>
                )}
              </div>
            </div>
            <Badge variant={connectionScope === 'shared' ? 'info' : 'success'}>
              {connectionScope === 'shared' ? 'Shared' : 'Personal'}
            </Badge>
          </div>
        </Card>
      )}

      {!connected && (
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Secure Trello OAuth (1.0a)</h3>
              <p className="text-sm text-gray-500">Recommended for production stores</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Authenticate with Trello using OAuth 1.0a to automatically manage tokens and permissions.
          </p>
          <Button
            onClick={handleOAuth1}
            disabled={oauthLoading || !canManageConnection}
            isLoading={oauthLoading}
            className="w-full"
            variant="outline"
            size="lg"
          >
            {oauthLoading ? 'Redirecting...' : canManageConnection ? 'Continue with Trello OAuth 1.0' : 'Only store owner can connect'}
          </Button>
        </Card>
      )}

      {!connected && (
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Manual Token Connection</h3>
              <p className="text-sm text-gray-500">Simple and direct</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3 text-sm">
              How to get your Trello token:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>
                Visit:{' '}
                <a
                  href={`https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=ShopiTrello&key=${trelloApiKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900 font-medium"
                >
                  Trello Authorization
                  <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                API Key:{' '}
                <code className="bg-white px-2 py-1 rounded text-xs font-mono">
                  {trelloApiKey}
                </code>
              </li>
              <li>Click "Allow" to grant permissions</li>
              <li>Copy the token that appears</li>
              <li>Paste it below</li>
            </ol>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trello Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ATTA..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              disabled={!canManageConnection}
            />
            <p className="mt-1 text-xs text-gray-500">Token should start with "ATTA"</p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={connecting || !token || !canManageConnection}
            isLoading={connecting}
            className="w-full"
            variant="primary"
            size="lg"
          >
            {connecting ? 'Connecting...' : canManageConnection ? 'Connect Trello' : 'Only store owner can connect'}
          </Button>
        </Card>
      )}

      {connected && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Connection Active</h3>
              <p className="text-sm text-gray-600">You can now sync boards, lists, and cards</p>
              {trelloMode === 'single' && connectionScope === 'shared' && (
                <p className="text-xs text-gray-500 mt-1">Shared connection managed by the store owner.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/app/boards')}
                variant="primary"
              >
                Go to Boards
              </Button>
              <Button
                onClick={() => {
                  if (!ensureCanManage('disconnect Trello')) return
                  authenticatedFetch('/api/trello/disconnect', { method: 'POST' })
                    .then(async (res) => {
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.error || 'Failed to disconnect Trello')
                      }
                      await checkConnection()
                    })
                    .catch((err: any) => {
                      console.error('Disconnect error:', err)
                      setError(err.message || 'Failed to disconnect Trello')
                    })
                }}
                variant="outline"
                disabled={!canManageConnection}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!connected && (
        <Card padding="lg" className="border-dashed">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Trello OAuth 2.0 (Coming Soon)</h3>
              <p className="text-sm text-gray-500">
                Trello is still rolling out official OAuth 2.0 support. We’ll enable this option once Atlassian activates 3LO scopes for Trello.
              </p>
            </div>
          </div>
          <Button className="w-full" variant="secondary" disabled>
            Coming Soon
          </Button>
        </Card>
      )}
    </div>
  )
}
