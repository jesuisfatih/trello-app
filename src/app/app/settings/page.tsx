'use client'

export default function SettingsPage() {
  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>API Status</h2>
        <div className='space-y-2'>
          <div className='flex justify-between p-3 bg-gray-50 rounded'>
            <span>Shopify</span>
            <span className='text-green-600'>Connected</span>
          </div>
          <div className='flex justify-between p-3 bg-gray-50 rounded'>
            <span>Trello</span>
            <span className='text-gray-500'>Not connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
