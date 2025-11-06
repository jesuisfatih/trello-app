'use client'

import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

export default function SettingsPage() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  async function testConnections() {
    setTesting(true)
    setTestResults(null)

    try {
      const shopifyResult = await fetch('/api/health').then((r) => r.json())
      const trelloResult = { status: 'pending' }

      setTestResults({
        shopify: shopifyResult,
        trello: trelloResult,
      })
    } catch (error) {
      console.error('Connection test failed:', error)
      setTestResults({ error: 'Failed to test connections' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4'>Settings</Typography>
      </Grid>

      {/* API Status */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' className='mb-4'>
              API Status
            </Typography>
            <Button
              variant='contained'
              onClick={testConnections}
              disabled={testing}
              className='mb-4'
            >
              {testing ? 'Testing...' : 'Test Connections'}
            </Button>

            {testResults && (
              <div className='flex flex-col gap-3'>
                {testResults.error ? (
                  <Alert severity='error'>{testResults.error}</Alert>
                ) : (
                  <>
                    <div className='flex justify-between items-center p-3 bg-gray-50 rounded'>
                      <Typography>Shopify</Typography>
                      <Chip
                        label={testResults.shopify?.status || 'Unknown'}
                        color={testResults.shopify?.status === 'ok' ? 'success' : 'error'}
                        size='small'
                      />
                    </div>
                    <div className='flex justify-between items-center p-3 bg-gray-50 rounded'>
                      <Typography>Trello</Typography>
                      <Chip
                        label={testResults.trello?.status || 'Not tested'}
                        color='warning'
                        size='small'
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Webhook Settings */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='h6' className='mb-4'>
              Webhook Settings
            </Typography>
            <Typography variant='body2' color='text.secondary' className='mb-4'>
              Webhooks are automatically configured when you connect your accounts.
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary='Shopify Webhooks' />
                <Chip label='Active' color='success' size='small' />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary='Trello Webhooks' />
                <Chip label='Not configured' color='default' size='small' />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* About */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' className='mb-4'>
              About
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary='App Version' secondary='1.0.0' />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary='API Version' secondary='2025-10' />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary='Theme' secondary='Vuexy + Material UI' />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
