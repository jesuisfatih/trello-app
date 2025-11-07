'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || ''

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const response = await fetch('/api/trello/status')
      const data = await response.json()
      
      if (data.connected && data.connection) {
        setConnected(true)
        
        // Get member info
        if (trelloApiKey) {
          const memberUrl = `https://api.trello.com/1/members/me?key=${trelloApiKey}&token=${data.connection.token}`
          const memberResponse = await fetch(memberUrl)
          if (memberResponse.ok) {
            const member = await memberResponse.json()
            setMemberInfo(member)
          }
        }
      }
    } catch (err) {
      console.error('Connection check failed:', err)
    } finally {
      setLoading(false)
    }
  }

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
