'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

export default function TrelloIntegrationPage() {
  const searchParams = useSearchParams()
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const success = searchParams.get('success')
    const errorParam = searchParams.get('error')

    if (success === 'true') {
      setConnected(true)
    }

    if (errorParam) {
      setError('Failed to connect to Trello. Please try again.')
    }
  }, [searchParams])

  async function handleConnect() {
    setConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/trello/oauth/start')
      const data = await response.json()

      if (data.authorizeUrl) {
        window.location.href = data.authorizeUrl
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth flow')
      setConnecting(false)
    }
  }

  return (
    <div className='flex justify-center'>
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent>
          <div className='text-center mb-6'>
            <i className='tabler-brand-trello text-6xl text-primary mb-4' />
            <Typography variant='h4' className='mb-2'>
              Connect to Trello
            </Typography>
            <Typography color='text.secondary'>
              Connect your Trello account to sync boards, lists, and cards with your Shopify store.
            </Typography>
          </div>

          {error && (
            <Alert severity='error' className='mb-4'>
              {error}
            </Alert>
          )}

          {connected && (
            <Alert severity='success' className='mb-4'>
              Successfully connected to Trello!
            </Alert>
          )}

          {!connected && (
            <>
              <Divider className='mb-4' />
              <Typography variant='h6' className='mb-2'>
                What you can do:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-check text-success' />
                  </ListItemIcon>
                  <ListItemText primary='Create and manage Trello boards' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-check text-success' />
                  </ListItemIcon>
                  <ListItemText primary='Add, update, and move cards' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-check text-success' />
                  </ListItemIcon>
                  <ListItemText primary='Add comments to cards' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-check text-success' />
                  </ListItemIcon>
                  <ListItemText primary='Assign members to cards' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-check text-success' />
                  </ListItemIcon>
                  <ListItemText primary='Set up webhooks for real-time sync' />
                </ListItem>
              </List>

              <Button
                fullWidth
                variant='contained'
                size='large'
                onClick={handleConnect}
                disabled={connecting}
                className='mt-4'
              >
                {connecting ? 'Connecting...' : 'Connect Trello Account'}
              </Button>
            </>
          )}

          {connected && (
            <div className='text-center mt-6'>
              <Button variant='contained' size='large' href='/app/boards'>
                Go to Boards
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
