'use client'

import { useEffect, useState } from 'react'

export default function BoardsPage() {
  const [boards, setBoards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) return <div className='p-8'>Loading...</div>

  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Trello Boards</h1>
        <button className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'>
          Create Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center'>
          <p className='text-gray-500 mb-4'>No boards found</p>
          <a href='/app/integrations/trello' className='text-blue-600 hover:underline'>
            Connect Trello to get started
          </a>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {boards.map((board: any) => (
            <div key={board.id} className='bg-white rounded-lg shadow p-4'>
              <h3 className='font-semibold mb-2'>{board.name}</h3>
              <div className='flex gap-2'>
                <a href={`/app/boards/${board.id}`} className='text-blue-600'>View</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
