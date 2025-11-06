'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ boardId: string }>
}

export default function BoardDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [boardId, setBoardId] = useState<string>('')
  const [board, setBoard] = useState<any>(null)
  const [lists, setLists] = useState<any[]>([])
  const [cards, setCards] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setBoardId(p.boardId)
      loadBoardData(p.boardId)
    })
  }, [params])

  async function loadBoardData(id: string) {
    try {
      // Check Trello connection
      const statusResponse = await fetch('/api/trello/status')
      const statusData = await statusResponse.json()
      
      if (!statusData.connected || !statusData.connection) {
        setConnected(false)
        setLoading(false)
        return
      }

      setConnected(true)
      const token = statusData.connection.token
      const apiKey = 'e2dc5f7dcce322a3945a62c228c31fa1'

      // Fetch board details
      const boardUrl = `https://api.trello.com/1/boards/${id}?key=${apiKey}&token=${token}`
      const boardResponse = await fetch(boardUrl)
      
      if (boardResponse.ok) {
        const boardData = await boardResponse.json()
        setBoard(boardData)
      } else {
        throw new Error('Failed to fetch board')
      }

      // Fetch lists
      const listsUrl = `https://api.trello.com/1/boards/${id}/lists?key=${apiKey}&token=${token}`
      const listsResponse = await fetch(listsUrl)
      
      if (listsResponse.ok) {
        const listsData = await listsResponse.json()
        setLists(listsData)

        // Fetch cards for each list
        const cardsData: Record<string, any[]> = {}
        for (const list of listsData) {
          const cardsUrl = `https://api.trello.com/1/lists/${list.id}/cards?key=${apiKey}&token=${token}`
          const cardsResponse = await fetch(cardsUrl)
          if (cardsResponse.ok) {
            cardsData[list.id] = await cardsResponse.json()
          }
        }
        setCards(cardsData)
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load board data:', err)
      setError(err.message || 'Failed to load board')
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
          <p className="text-yellow-700 mb-4">Please connect your Trello account first</p>
          <Link href="/app/integrations/trello">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Connect Trello
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link href="/app/boards">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Boards
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">Board not found</p>
          <Link href="/app/boards">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Boards
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/boards">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
          {board.desc && (
            <p className="text-gray-600 mt-1">{board.desc}</p>
          )}
        </div>
      </div>

      {/* Lists and Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {lists.map((list) => (
          <div key={list.id} className="flex-shrink-0 w-80">
            <Card padding="sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{list.name}</h3>
                <span className="text-sm text-gray-500">
                  {cards[list.id]?.length || 0} cards
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {cards[list.id]?.map((card: any) => (
                  <div
                    key={card.id}
                    className="bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-gray-900">{card.name}</p>
                    {card.due && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(card.due).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                
                {(!cards[list.id] || cards[list.id].length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No cards</p>
                )}
              </div>

              {/* Add Card Button */}
              <button className="w-full mt-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add card
              </button>
            </Card>
          </div>
        ))}

        {/* Add List Button */}
        <div className="flex-shrink-0 w-80">
          <button className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 justify-center">
            <Plus className="h-5 w-5" />
            Add list
          </button>
        </div>
      </div>
    </div>
  )
}
