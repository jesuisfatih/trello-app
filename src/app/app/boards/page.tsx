'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CardActions from '@mui/material/CardActions'

// Component Imports
import { useAppBridge } from '@/lib/app-bridge-provider'

interface Board {
  id: string
  name: string
  desc: string
  url: string
  closed: boolean
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBoards()
  }, [])

  async function loadBoards() {
    try {
      // TODO: Get session token from App Bridge
      // const { authenticatedFetch } = useAppBridge()
      // const response = await authenticatedFetch('/api/trello/boards')
      // const data = await response.json()
      // setBoards(data.boards || [])
      setBoards([])
    } catch (err: any) {
      setError(err.message || 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Typography>Loading boards...</Typography>
      </div>
    )
  }

  if (error) {
    return (
      <Alert severity='error' action={
        <Button color='inherit' size='small' onClick={loadBoards}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <div className='flex justify-between items-center mb-6'>
          <Typography variant='h4'>Trello Boards</Typography>
          <Button variant='contained'>
            Create Board
          </Button>
        </div>
      </Grid>

      {boards.length === 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent className='text-center py-12'>
              <Typography variant='h6' className='mb-2'>No boards found</Typography>
              <Typography color='text.secondary' className='mb-4'>
                Connect Trello to get started
              </Typography>
              <Button variant='contained' href='/app/integrations/trello'>
                Connect Trello
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ) : (
        boards.map((board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card>
              <CardContent>
                <Typography variant='h6' className='mb-2'>{board.name}</Typography>
                {board.desc && (
                  <Typography variant='body2' color='text.secondary' className='mb-3'>
                    {board.desc}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size='small' href={`/app/boards/${board.id}`}>
                  View
                </Button>
                <Button size='small' href={board.url} target='_blank'>
                  Open in Trello
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  )
}
