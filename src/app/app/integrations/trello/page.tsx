'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'

export const dynamic = 'force-dynamic'

export default function TrelloIntegrationPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    if (!token) {
      setError('Please enter your Trello token')
      return
    }

    // Validate token format
    if (!token.startsWith('ATTA')) {
      setError('Invalid token format. Trello tokens should start with "ATTA".')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      // Direct API call to Trello (no shop domain needed)
      const apiKey = 'e2dc5f7dcce322a3945a62c228c31fa1'
      const testUrl = `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
      
      const testResponse = await fetch(testUrl)
      
      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('Invalid Trello token. Please check your token and try again.')
        }
        throw new Error(`Trello API error: ${testResponse.status}`)
      }

      const member = await testResponse.json()
      
      // Save to our backend (with simple cookie-based shop identification)
      const saveResponse = await fetch('/api/trello/connect/simple', {
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
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Trello')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Connect to Trello</h1>
        <p className="text-gray-600">Enter your Trello token to sync boards, lists, and cards</p>
      </div>

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
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
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
                  href="https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=ShopiTrello&key=e2dc5f7dcce322a3945a62c228c31fa1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900 font-medium"
                >
                  Trello Authorization
                  <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                API Key: <code className="bg-white px-2 py-1 rounded text-xs font-mono">e2dc5f7dcce322a3945a62c228c31fa1</code>
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
            />
            <p className="mt-1 text-xs text-gray-500">Token should start with "ATTA"</p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={connecting || !token}
            isLoading={connecting}
            className="w-full"
            variant="primary"
            size="lg"
          >
            {connecting ? 'Connecting...' : 'Connect Trello'}
          </Button>
        </Card>
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
