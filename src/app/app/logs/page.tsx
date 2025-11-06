'use client'

export const dynamic = 'force-dynamic'

export default function LogsPage() {
  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Event Logs</h1>
      
      <div className='bg-white rounded-lg shadow p-6'>
        <p className='text-gray-500'>No logs found</p>
      </div>
    </div>
  )
}
