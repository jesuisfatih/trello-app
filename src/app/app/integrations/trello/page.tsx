'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TrelloIntegrationPage() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      // TODO: Check if already connected
      setConnected(false)
    } catch (err) {
      console.error('Check failed:', err)
    }
  }

  async function handleConnect() {
    if (!token) {
      setError('Please enter your Trello token')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/trello/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection failed')
      }

      setConnected(true)
      setToken('')
    } catch (err: any) {
      setError(err.message || 'Failed to connect')
      setConnecting(false)
    }
  }

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <div className='bg-white rounded-lg shadow p-8'>
        <div className='text-center mb-6'>
          <div className='text-6xl mb-4'>🔗</div>
          <h2 className='text-2xl font-bold mb-2'>Connect to Trello</h2>
          <p className='text-gray-600'>
            Enter your Trello token to sync boards, lists, and cards.
          </p>
        </div>

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

        {!connected && (
          <>
            <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded'>
              <h3 className='font-semibold text-blue-900 mb-2'>
                How to get your Trello token:
              </h3>
              <ol className='list-decimal list-inside space-y-1 text-blue-800 text-sm'>
                <li>Visit: <a href='https://trello.com/1/authorize' target='_blank' className='underline'>Trello Authorization</a></li>
                <li>API Key: <code className='bg-white px-2 py-1 rounded'>e2dc5f7dcce322a3945a62c228c31fa1</code></li>
                <li>Grant permissions and copy the token</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Trello Token
              </label>
              <input
                type='text'
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder='ATTAxxxxx...'
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting || !token}
              className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {connecting ? 'Connecting...' : 'Connect Trello'}
            </button>

            <div className='mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600'>
              <p className='font-semibold mb-2'>Your current token (for reference):</p>
              <code className='block bg-white p-2 rounded overflow-x-auto text-xs'>
                ATTAec6e0fe59442fa58221256889508486aa8317ebd5f5a960e2789cf499080268d0908E969
              </code>
            </div>
          </>
        )}

        {connected && (
          <div className='text-center mt-6'>
            <a
              href='/app/boards'
              className='inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Go to Boards
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
