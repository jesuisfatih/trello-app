'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function BoardsPage() {
  const [boards, setBoards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    checkTrelloConnection()
  }, [])

  async function checkTrelloConnection() {
    try {
      const response = await fetch('/api/trello/status')
      const data = await response.json()
      
      if (data.connected && data.connection) {
        setConnected(true)
        // Fetch boards
        await fetchBoards(data.connection.token)
      } else {
        setConnected(false)
      }
    } catch (err) {
      console.error('Connection check failed:', err)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBoards(token: string) {
    try {
      const apiKey = 'e2dc5f7dcce322a3945a62c228c31fa1'
      const boardsUrl = `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}`
      const response = await fetch(boardsUrl)
      
      if (response.ok) {
        const boardsData = await response.json()
        setBoards(boardsData)
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err)
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Trello Boards</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No boards found</p>
          <p className="text-sm text-gray-400">Your Trello boards will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boards.map((board: any) => (
            <div key={board.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">{board.name}</h3>
              <Link href={`/app/boards/${board.id}`}>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View Board →
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
