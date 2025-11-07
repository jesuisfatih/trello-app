'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'
import { CheckCircle2, Zap } from 'lucide-react'
import { useAppBridge } from '@/lib/app-bridge-provider'

export const dynamic = 'force-dynamic'

const FALLBACK_TRELLO_API_KEY = '700a7218afc6cb86683668584a52645b'

export default function MappingsPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const { authenticatedFetch } = useAppBridge()
  const [boards, setBoards] = useState<any[]>([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const [selectedList, setSelectedList] = useState('')
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || FALLBACK_TRELLO_API_KEY

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const response = await authenticatedFetch('/api/trello/status')
      const data = await response.json()
      
      if (data.connected && data.connection) {
        setConnected(true)
        // Fetch boards for mapping
        const boardsUrl = `https://api.trello.com/1/members/me/boards?key=${trelloApiKey}&token=${data.connection.token}`
        const boardsResponse = await fetch(boardsUrl)
        if (boardsResponse.ok) {
          const boardsData = await boardsResponse.json()
          setBoards(boardsData)
        }
      }
    } catch (err) {
      console.error('Connection check failed:', err)
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

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Trello Not Connected</h2>
          <p className="text-yellow-700 mb-4">Please connect Trello first to set up mappings</p>
          <Link href="/app/integrations/trello">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Connect Trello
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopify → Trello Mappings</h1>
          <p className="text-gray-600 mt-1">Automate Trello actions based on Shopify events</p>
        </div>
        <Button variant="primary">Save Mappings</Button>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">New Order → Create Card</h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm font-medium">Enabled</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Board
              </label>
              <select 
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a board...</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>{board.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target List
              </label>
              <select 
                value={selectedList}
                onChange={(e) => setSelectedList(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedBoard}
              >
                <option value="">Select a list...</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 Configure mappings to automatically create Trello cards when Shopify events occur
          </p>
        </div>
      </div>
    </div>
  )
}
