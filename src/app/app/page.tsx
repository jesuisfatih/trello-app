'use client'

import { useEffect, useState } from 'react'
import { useAppBridge } from '@/lib/app-bridge-provider'

export default function Dashboard() {
  const [status, setStatus] = useState({ shopify: true, trello: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <div className='p-8'>Loading...</div>
  }

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8'>ShopiTrello Dashboard</h1>
      
      {/* Connection Status */}
      <div className='bg-white rounded-lg shadow p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-4'>Connection Status</h2>
        <div className='flex gap-4'>
          <div className='flex items-center gap-2'>
            <div className={`w-3 h-3 rounded-full ${status.shopify ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>Shopify</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className={`w-3 h-3 rounded-full ${status.trello ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>Trello</span>
          </div>
        </div>
        {!status.trello && (
          <a
            href='/app/integrations/trello'
            className='inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Connect Trello
          </a>
        )}
      </div>

      {/* Quick Actions */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <a href='/app/boards' className='p-6 border rounded hover:bg-gray-50 text-center'>
            <div className='text-3xl mb-2'>📋</div>
            <div className='font-medium'>Boards</div>
          </a>
          <a href='/app/mappings' className='p-6 border rounded hover:bg-gray-50 text-center'>
            <div className='text-3xl mb-2'>🔗</div>
            <div className='font-medium'>Mappings</div>
          </a>
          <a href='/app/logs' className='p-6 border rounded hover:bg-gray-50 text-center'>
            <div className='text-3xl mb-2'>📝</div>
            <div className='font-medium'>Logs</div>
          </a>
          <a href='/app/settings' className='p-6 border rounded hover:bg-gray-50 text-center'>
            <div className='text-3xl mb-2'>⚙️</div>
            <div className='font-medium'>Settings</div>
          </a>
        </div>
      </div>
    </div>
  )
}
