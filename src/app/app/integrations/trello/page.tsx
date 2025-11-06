'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TrelloIntegrationPage() {
  const searchParams = useSearchParams()
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('success') === 'true') setConnected(true)
    if (searchParams.get('error')) setError('Failed to connect')
  }, [searchParams])

  async function handleConnect() {
    setConnecting(true)
    try {
      const response = await fetch('/api/trello/oauth/start')
      const data = await response.json()
      if (data.authorizeUrl) window.location.href = data.authorizeUrl
    } catch (err) {
      setError('Failed to start OAuth flow')
      setConnecting(false)
    }
  }

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <div className='bg-white rounded-lg shadow p-8 text-center'>
        <div className='text-6xl mb-4'>🔗</div>
        <h2 className='text-2xl font-bold mb-2'>Connect to Trello</h2>
        <p className='text-gray-600 mb-6'>
          Connect your Trello account to sync boards, lists, and cards.
        </p>

        {error && (
          <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700'>
            {error}
          </div>
        )}

        {connected && (
          <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700'>
            Successfully connected to Trello!
          </div>
        )}

        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className='px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
          >
            {connecting ? 'Connecting...' : 'Connect Trello Account'}
          </button>
        ) : (
          <a
            href='/app/boards'
            className='inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Go to Boards
          </a>
        )}
      </div>
    </div>
  )
}
