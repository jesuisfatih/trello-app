'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

// Component Imports
import { useAppBridge } from '@/lib/app-bridge-provider'

interface ConnectionStatus {
  shopify: boolean
  trello: boolean
}

interface Activity {
  id: string
  type: string
  message: string
  timestamp: string
}

export default function Dashboard() {
  const [status, setStatus] = useState<ConnectionStatus>({
    shopify: false,
    trello: false,
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // TODO: Fetch actual data from API
      setStatus({
        shopify: true,
        trello: false,
      })

      setActivities([
        {
          id: '1',
          type: 'info',
          message: 'Welcome to ShopiTrello!',
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Typography>Loading...</Typography>
      </div>
    )
  }

  return (
    <Grid container spacing={6}>
      {/* Connection Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mb-4'>
              Connection Status
            </Typography>
            <div className='flex gap-6'>
              <div className='flex items-center gap-2'>
                <Chip
                  label='Shopify'
                  color={status.shopify ? 'success' : 'default'}
                  variant={status.shopify ? 'filled' : 'outlined'}
                />
              </div>
              <div className='flex items-center gap-2'>
                <Chip
                  label='Trello'
                  color={status.trello ? 'success' : 'default'}
                  variant={status.trello ? 'filled' : 'outlined'}
                />
              </div>
            </div>
            {!status.trello && (
              <div className='mt-4'>
                <Button variant='contained' href='/app/integrations/trello'>
                  Connect Trello
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activities */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mb-4'>
              Recent Activities
            </Typography>
            {activities.length === 0 ? (
              <Typography color='text.secondary'>No recent activities</Typography>
            ) : (
              <div className='flex flex-col gap-3'>
                {activities.map((activity) => (
                  <Alert key={activity.id} severity='info'>
                    <div>
                      <Typography variant='body2'>{activity.message}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mb-4'>
              Quick Actions
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  href='/app/boards'
                  className='flex flex-col gap-2 p-4'
                  sx={{ height: '100px' }}
                >
                  <i className='tabler-layout-board text-3xl' />
                  <span>Boards</span>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  href='/app/mappings'
                  className='flex flex-col gap-2 p-4'
                  sx={{ height: '100px' }}
                >
                  <i className='tabler-arrows-exchange text-3xl' />
                  <span>Mappings</span>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  href='/app/logs'
                  className='flex flex-col gap-2 p-4'
                  sx={{ height: '100px' }}
                >
                  <i className='tabler-file-text text-3xl' />
                  <span>Logs</span>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant='outlined'
                  href='/app/settings'
                  className='flex flex-col gap-2 p-4'
                  sx={{ height: '100px' }}
                >
                  <i className='tabler-settings text-3xl' />
                  <span>Settings</span>
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
