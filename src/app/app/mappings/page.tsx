'use client'

export default function MappingsPage() {
  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Shopify → Trello Mappings</h1>
          <p className='text-gray-600 mt-1'>Automate Trello actions based on Shopify events</p>
        </div>
        <button className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'>
          Save Mappings
        </button>
      </div>

      <div className='space-y-4'>
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>New Order → Create Card</h3>
            <label className='flex items-center gap-2'>
              <input type='checkbox' className='w-4 h-4' />
              <span>Enabled</span>
            </label>
          </div>
        </div>

        <div className='bg-blue-50 border border-blue-200 rounded p-4'>
          <p className='text-sm text-blue-800'>
            💡 Configure mappings to automatically create Trello cards when Shopify events occur
          </p>
        </div>
      </div>
    </div>
  )
}
