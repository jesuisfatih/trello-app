'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, FolderKanban, Link2, FileText, Settings, ArrowRight, Zap } from 'lucide-react'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'

export const dynamic = 'force-dynamic'

const FALLBACK_TRELLO_API_KEY = '700a7218afc6cb86683668584a52645b'

export default function Dashboard() {
  const [status, setStatus] = useState({ shopify: true, trello: false })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ boards: 0, mappings: 0, eventsToday: 0 })
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || FALLBACK_TRELLO_API_KEY

  useEffect(() => {
    checkConnections()
  }, [])

  async function checkConnections() {
    try {
      // Check Trello connection
      const trelloResponse = await fetch('/api/trello/status')
      const trelloData = await trelloResponse.json()
      
      setStatus({
        shopify: true,
        trello: trelloData.connected || false,
      })

      // If connected, fetch stats
      if (trelloData.connected && trelloData.connection) {
        const token = trelloData.connection.token
        
        // Get boards count
        const boardsUrl = `https://api.trello.com/1/members/me/boards?key=${trelloApiKey}&token=${token}`
        const boardsResponse = await fetch(boardsUrl)
        if (boardsResponse.ok) {
          const boards = await boardsResponse.json()
          setStats(prev => ({ ...prev, boards: boards.length }))
        }
      }
    } catch (err) {
      console.error('Failed to check connections:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const quickActions = [
    { name: 'Boards', href: '/app/boards', icon: FolderKanban, color: 'from-blue-500 to-blue-600' },
    { name: 'Mappings', href: '/app/mappings', icon: Link2, color: 'from-purple-500 to-purple-600' },
    { name: 'Logs', href: '/app/logs', icon: FileText, color: 'from-green-500 to-green-600' },
    { name: 'Settings', href: '/app/settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to SEO DROME TEAM</h1>
        <p className="text-gray-600">Manage your projects with powerful Trello integration</p>
      </div>

      {/* Connection Status */}
      <Card hover>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.shopify ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-900">Shopify</span>
            </div>
            {status.shopify ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="error">Disconnected</Badge>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.trello ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-900">Trello</span>
            </div>
            {status.trello ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="error">Disconnected</Badge>
            )}
          </div>
        </div>
        {!status.trello && (
          <Link href="/app/integrations/trello">
            <Button className="w-full md:w-auto">
              Connect Trello
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </Card>

      {/* Quick Actions */}
      <Card hover>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <Zap className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.name}
                href={action.href}
                className="group relative overflow-hidden p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.name}</h3>
                <p className="text-sm text-gray-500">Manage {action.name.toLowerCase()}</p>
                <ArrowRight className="absolute top-6 right-6 h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
              </Link>
            )
          })}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Boards</p>
              <p className="text-3xl font-bold text-gray-900">{stats.boards}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Mappings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.mappings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Link2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Events Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.eventsToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
