'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'

// Component Imports
import { useAppBridge } from '@/lib/app-bridge-provider'
import { useToast } from '@/ui/components/Toast'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'

interface MappingConfig {
  newOrder?: {
    enabled: boolean
    listId?: string
  }
  orderFulfilled?: {
    enabled: boolean
    targetListId?: string
  }
  newProduct?: {
    enabled: boolean
    listId?: string
  }
  newCustomer?: {
    enabled: boolean
    listId?: string
  }
}

export default function MappingsPage() {
  const [mappings, setMappings] = useState<MappingConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const { authenticatedFetch } = useAppBridge()
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const response = await authenticatedFetch('/api/mappings')
      const data = await response.json()
      setMappings(data.mappings || {})
    } catch (error: any) {
      showToast(error.message || 'Failed to load mappings', true)
    } finally {
      setLoading(false)
    }
  }

  async function saveMappings() {
    setSaving(true)
    try {
      const response = await authenticatedFetch('/api/mappings', {
        method: 'PUT',
        body: JSON.stringify({ mappings }),
      })

      if (!response.ok) throw new Error('Failed to save mappings')

      showToast('Mappings saved successfully!')
    } catch (error: any) {
      showToast(error.message || 'Failed to save mappings', true)
    } finally {
      setSaving(false)
    }
  }

  function updateMapping(key: keyof MappingConfig, field: string, value: any) {
    setMappings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <LoadingSpinner size='lg' />
      </div>
    )
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <Typography variant='h4'>Shopify → Trello Mappings</Typography>
          <Typography color='text.secondary' className='mt-1'>
            Automate Trello actions based on Shopify events
          </Typography>
        </div>
        <Button variant='contained' onClick={saveMappings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Mappings'}
        </Button>
      </div>

      <Grid container spacing={6}>
        {/* New Order Mapping */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6'>New Order → Create Card</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mappings.newOrder?.enabled || false}
                      onChange={(e) => updateMapping('newOrder', 'enabled', e.target.checked)}
                    />
                  }
                  label='Enabled'
                />
              </div>
              {mappings.newOrder?.enabled && (
                <TextField
                  fullWidth
                  label='Target List ID'
                  value={mappings.newOrder.listId || ''}
                  onChange={(e) => updateMapping('newOrder', 'listId', e.target.value)}
                  placeholder='Enter Trello List ID'
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Fulfilled Mapping */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6'>Order Fulfilled → Move Card</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mappings.orderFulfilled?.enabled || false}
                      onChange={(e) => updateMapping('orderFulfilled', 'enabled', e.target.checked)}
                    />
                  }
                  label='Enabled'
                />
              </div>
              {mappings.orderFulfilled?.enabled && (
                <TextField
                  fullWidth
                  label='Target List ID'
                  value={mappings.orderFulfilled.targetListId || ''}
                  onChange={(e) => updateMapping('orderFulfilled', 'targetListId', e.target.value)}
                  placeholder='Enter Trello List ID'
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* New Product Mapping */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6'>New Product → Create Card</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mappings.newProduct?.enabled || false}
                      onChange={(e) => updateMapping('newProduct', 'enabled', e.target.checked)}
                    />
                  }
                  label='Enabled'
                />
              </div>
              {mappings.newProduct?.enabled && (
                <TextField
                  fullWidth
                  label='Target List ID'
                  value={mappings.newProduct.listId || ''}
                  onChange={(e) => updateMapping('newProduct', 'listId', e.target.value)}
                  placeholder='Enter Trello List ID'
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* New Customer Mapping */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <Typography variant='h6'>New Customer → Create Card</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mappings.newCustomer?.enabled || false}
                      onChange={(e) => updateMapping('newCustomer', 'enabled', e.target.checked)}
                    />
                  }
                  label='Enabled'
                />
              </div>
              {mappings.newCustomer?.enabled && (
                <TextField
                  fullWidth
                  label='Target List ID'
                  value={mappings.newCustomer.listId || ''}
                  onChange={(e) => updateMapping('newCustomer', 'listId', e.target.value)}
                  placeholder='Enter Trello List ID'
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Help */}
        <Grid item xs={12}>
          <Alert severity='info'>
            <Typography variant='subtitle2' className='mb-2'>
              💡 How to find List ID
            </Typography>
            <ol className='list-decimal list-inside space-y-1'>
              <li>Open your board in Trello</li>
              <li>Add ".json" to the URL</li>
              <li>Find your list and copy its "id" field</li>
              <li>Paste it in the Target List field above</li>
            </ol>
          </Alert>
        </Grid>
      </Grid>
    </div>
  )
}
