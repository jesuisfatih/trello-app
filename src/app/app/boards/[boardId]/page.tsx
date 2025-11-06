'use client'

import { useParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function BoardDetailPage() {
  const params = useParams()
  const boardId = params.boardId as string

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <a href='/app/boards' className='text-blue-600 hover:underline mb-4 inline-block'>
        ← Back to Boards
      </a>
      <h1 className='text-3xl font-bold mb-6'>Board: {boardId}</h1>
      
      <div className='bg-white rounded-lg shadow p-6'>
        <p className='text-gray-500'>Board details will appear here</p>
      </div>
    </div>
  )
}
