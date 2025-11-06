'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, MoreVertical, User, Calendar, Tag } from 'lucide-react'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Card'
import { Badge } from '@/ui/components/Card'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ boardId: string }>
}

export default function BoardDetailPage({ params }: PageProps) {
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
      const boardUrl = `https://api.trello.com/1/boards/${id}?key=${apiKey}&token=${token}&fields=name,desc,prefs,url`
      const boardResponse = await fetch(boardUrl)
      
      if (boardResponse.ok) {
        const boardData = await boardResponse.json()
        setBoard(boardData)
      } else {
        throw new Error('Failed to fetch board')
      }

      // Fetch lists
      const listsUrl = `https://api.trello.com/1/boards/${id}/lists?key=${apiKey}&token=${token}&cards=open`
      const listsResponse = await fetch(listsUrl)
      
      if (listsResponse.ok) {
        const listsData = await listsResponse.json()
        setLists(listsData)

        // Fetch cards for each list with members and labels
        const cardsData: Record<string, any[]> = {}
        for (const list of listsData) {
          const cardsUrl = `https://api.trello.com/1/lists/${list.id}/cards?key=${apiKey}&token=${token}&members=true&labels=all&checklists=all`
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

  if (error || !board) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error || 'Board not found'}</p>
          <Link href="/app/boards">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Boards
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const bgGradient = board.prefs?.backgroundColor || '#0079BF'

  return (
    <div className="min-h-screen -m-6 -mt-6" style={{ background: `linear-gradient(135deg, ${bgGradient} 0%, ${bgGradient}dd 100%)` }}>
      {/* Header */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app/boards">
                <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  {board.name}
                </h1>
                {board.desc && (
                  <p className="text-white/80 text-sm mt-1">{board.desc}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={board.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Open in Trello
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {lists.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-100 rounded-xl shadow-sm">
                {/* List Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{list.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {cards[list.id]?.length || 0}
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {cards[list.id]?.map((card: any) => (
                    <div
                      key={card.id}
                      className="group bg-white p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 border border-gray-200 hover:border-gray-300"
                    >
                      {/* Card Labels */}
                      {card.labels && card.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {card.labels.map((label: any) => (
                            <span
                              key={label.id}
                              className="px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: label.color || '#gray' }}
                            >
                              {label.name || label.color}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Title */}
                      <p className="text-sm font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {card.name}
                      </p>

                      {/* Card Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {card.due && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(card.due).toLocaleDateString()}</span>
                          </div>
                        )}
                        {card.idMembers && card.idMembers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{card.idMembers.length}</span>
                          </div>
                        )}
                        {card.badges?.checkItems > 0 && (
                          <div className="flex items-center gap-1">
                            <span>{card.badges.checkItemsChecked}/{card.badges.checkItems}</span>
                          </div>
                        )}
                        {card.badges?.comments > 0 && (
                          <div className="flex items-center gap-1">
                            💬 {card.badges.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!cards[list.id] || cards[list.id].length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-8">No cards</p>
                  )}
                </div>

                {/* Add Card Button */}
                <div className="px-3 pb-3">
                  <button className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-white/50 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add a card
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add List Button */}
          <div className="flex-shrink-0 w-80">
            <button className="w-full p-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl text-white font-medium flex items-center gap-2 justify-center transition-colors">
              <Plus className="h-5 w-5" />
              Add another list
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
