'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Link2, CheckCircle2, XCircle, ExternalLink, Key } from 'lucide-react'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'
import { useAppBridge } from '@/lib/app-bridge-provider'

export const dynamic = 'force-dynamic'

export default function TrelloIntegrationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getSessionToken } = useAppBridge()
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [useOAuth, setUseOAuth] = useState(true) // Default to OAuth 2.0
  const [shopDomain, setShopDomain] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    let resolvedShop = params.get('shop')
    const hostParam = params.get('host')

    if (!resolvedShop && hostParam) {
      try {
        const decodedHost = atob(hostParam)
        const match = decodedHost.match(/([a-zA-Z0-9-]+\.myshopify\.com)/)
        if (match) {
          resolvedShop = match[1]
        } else {
          const storeMatch = decodedHost.match(/store\/([a-zA-Z0-9-]+)/)
          if (storeMatch) {
            resolvedShop = `${storeMatch[1]}.myshopify.com`
          }
        }
      } catch (err) {
        const directMatch = hostParam.match(/([a-zA-Z0-9-]+\.myshopify\.com)/)
        if (directMatch) {
          resolvedShop = directMatch[1]
        } else {
          const storeMatch = hostParam.match(/store\/([a-zA-Z0-9-]+)/)
          if (storeMatch) {
            resolvedShop = `${storeMatch[1]}.myshopify.com`
          }
        }
      }
    }

    if (resolvedShop) {
      setShopDomain(resolvedShop)
    }
  }, [])

  useEffect(() => {
    const success = searchParams.get('success')
    const errorParam = searchParams.get('error')
    
    if (success === 'true') {
      setConnected(true)
      setError(null)
      checkConnection()
    } else if (errorParam) {
      setError('OAuth connection failed. Please try again.')
    }
    
    checkConnection()
  }, [searchParams])

  async function checkConnection() {
    try {
      setLoading(true)
      const sessionToken = await getSessionToken()

      let url = '/api/trello/connect'
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const hostParam = params.get('host')
        const queryParts: string[] = []
        if (hostParam) {
          queryParts.push(`host=${encodeURIComponent(hostParam)}`)
        }
        if (shopDomain) {
          queryParts.push(`shop=${encodeURIComponent(shopDomain)}`)
        }
        if (queryParts.length) {
          url += `?${queryParts.join('&')}`
        }
      }

      const headers: HeadersInit = {}
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`
      }
      
      const response = await fetch(url, {
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected)
        if (data.connected && data.connection) {
          setConnectionInfo(data.connection)
        }
      }
    } catch (err) {
      console.error('Check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthConnect() {
    try {
      setConnecting(true)
      setError(null)

      const sessionToken = await getSessionToken()

      let url = '/api/trello/oauth/start'
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const hostParam = params.get('host')
        if (hostParam) {
          params.set('host', hostParam)
        }
        if (shopDomain) {
          params.set('shop', shopDomain)
        }
        if ([...params.keys()].length) {
          url += `?${params.toString()}`
        }
      }

      const headers: HeadersInit = {}
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`
      }

      const response = await fetch(url, {
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to start OAuth flow')
      }

      const data = await response.json()
      if (data.authorizeUrl) {
        // Redirect to OAuth authorization
        window.location.href = data.authorizeUrl
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth')
      setConnecting(false)
    }
  }

  async function handleManualConnect() {
    if (!token) {
      setError('Please enter your Trello token')
      return
    }

    // Validate token format
    if (!token.startsWith('ATTA') && !token.match(/^[a-zA-Z0-9]{64}$/)) {
      setError('Invalid token format. Trello tokens should start with "ATTA" or be 64 characters long.')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const sessionToken = await getSessionToken()
      
      // Build URL with host/shop parameters if available (for shop domain fallback)
      let hostParam: string | null = null
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        hostParam = urlParams.get('host')
      }

      let url = '/api/trello/connect'
      const queryParts: string[] = []
      if (hostParam) {
        queryParts.push(`host=${encodeURIComponent(hostParam)}`)
      }
      if (shopDomain) {
        queryParts.push(`shop=${encodeURIComponent(shopDomain)}`)
      }
      if (queryParts.length) {
        url += `?${queryParts.join('&')}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ token, shopDomain }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection failed')
      }

      setConnected(true)
      setToken('')
      await checkConnection()
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Trello. Please check your token and try again.')
    } finally {
      setConnecting(false)
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Trello Integration</h1>
        <p className="text-gray-600">Connect your Trello account to sync boards, lists, and cards</p>
      </div>

      {/* Connection Status */}
      {connected && (
        <Card className="border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Connected to Trello</h3>
                {connectionInfo && (
                  <p className="text-sm text-green-700">Member ID: {connectionInfo.memberId}</p>
                )}
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {!connected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OAuth 2.0 Option */}
          <Card hover padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">OAuth 2.0 (Recommended)</h3>
                <p className="text-sm text-gray-500">Secure and automatic</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Connect using Atlassian OAuth 2.0. This is the recommended method as it's more secure and handles token refresh automatically.
            </p>
            <Button
              onClick={handleOAuthConnect}
              disabled={connecting}
              className="w-full"
              variant="primary"
            >
              {connecting ? 'Connecting...' : 'Connect with OAuth 2.0'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          {/* Manual Token Option */}
          <Card hover padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manual Token</h3>
                <p className="text-sm text-gray-500">Advanced option</p>
              </div>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                How to get your Trello token:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
                <li>
                  Visit:{' '}
                  <a
                    href="https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=ShopiTrello&key=e2dc5f7dcce322a3945a62c228c31fa1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900"
                  >
                    Trello Authorization
                  </a>
                </li>
                <li>API Key: <code className="bg-white px-1 py-0.5 rounded text-xs">e2dc5f7dcce322a3945a62c228c31fa1</code></li>
                <li>Grant permissions and copy the token</li>
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
                placeholder="ATTAxxxxx..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Button
              onClick={handleManualConnect}
              disabled={connecting || !token}
              className="w-full"
              variant="outline"
            >
              {connecting ? 'Connecting...' : 'Connect with Token'}
            </Button>
          </Card>
        </div>
      )}

      {connected && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Connection Active</h3>
              <p className="text-sm text-gray-600">You can now sync boards, lists, and cards</p>
            </div>
            <Button
              onClick={() => router.push('/app/boards')}
              variant="primary"
            >
              Go to Boards
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
