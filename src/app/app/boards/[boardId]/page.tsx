'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'

interface List {
  id: string
  name: string
  closed: boolean
}

interface Card {
  id: string
  name: string
  desc: string
  idList: string
  due?: string
  closed: boolean
}

export default function BoardDetailPage() {
  const params = useParams()
  const boardId = params.boardId as string
  
  const [board, setBoard] = useState<any>(null)
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<{ [key: string]: Card[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (boardId) {
      loadBoardData()
    }
  }, [boardId])

  async function loadBoardData() {
    try {
      // TODO: Get session token from App Bridge and fetch data
      setBoard({ id: boardId, name: 'Loading...', desc: '' })
      setLists([])
      setCards({})
    } catch (err: any) {
      setError(err.message || 'Failed to load board data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Typography>Loading board...</Typography>
      </div>
    )
  }

  if (error || !board) {
    return (
      <Alert severity='error' className='mb-4'>
        {error || 'Board not found'}
      </Alert>
    )
  }

  return (
    <div>
      <div className='mb-6'>
        <Button href='/app/boards' size='small' className='mb-2'>
          ← Back to Boards
        </Button>
        <Typography variant='h4' className='mb-2'>{board.name}</Typography>
        {board.desc && (
          <Typography color='text.secondary'>{board.desc}</Typography>
        )}
      </div>

      <div className='flex gap-4 overflow-x-auto pb-4'>
        {lists.map((list) => (
          <Card key={list.id} sx={{ minWidth: 320, maxWidth: 320 }}>
            <CardContent>
              <div className='flex justify-between items-center mb-3'>
                <Typography variant='h6'>{list.name}</Typography>
                <Chip label={cards[list.id]?.length || 0} size='small' />
              </div>

              <div className='space-y-2'>
                {(cards[list.id] || []).map((card) => (
                  <Card key={card.id} variant='outlined' className='cursor-pointer hover:shadow-md'>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant='body2' className='font-medium'>
                        {card.name}
                      </Typography>
                      {card.desc && (
                        <Typography variant='caption' color='text.secondary' className='line-clamp-2'>
                          {card.desc}
                        </Typography>
                      )}
                      {card.due && (
                        <Chip
                          label={`Due: ${new Date(card.due).toLocaleDateString()}`}
                          size='small'
                          color='warning'
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button fullWidth variant='text' size='small'>
                  + Add Card
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {lists.length === 0 && (
          <Card sx={{ minWidth: 320 }}>
            <CardContent className='text-center py-12'>
              <Typography color='text.secondary' className='mb-3'>
                No lists yet
              </Typography>
              <Button variant='contained'>Create First List</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
