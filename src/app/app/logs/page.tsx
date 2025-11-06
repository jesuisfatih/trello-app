'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import ButtonGroup from '@mui/material/ButtonGroup'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

interface Log {
  id: string
  source: string
  type: string
  status: string
  createdAt: string
  errorMsg?: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'shopify' | 'trello'>('all')

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    setLoading(true)
    try {
      // TODO: Fetch actual logs from API
      setLogs([])
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) =>
    filter === 'all' ? true : log.source === filter
  )

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <Typography variant='h4'>Event Logs</Typography>
        <ButtonGroup variant='outlined'>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'shopify' ? 'contained' : 'outlined'}
            onClick={() => setFilter('shopify')}
          >
            Shopify
          </Button>
          <Button
            variant={filter === 'trello' ? 'contained' : 'outlined'}
            onClick={() => setFilter('trello')}
          >
            Trello
          </Button>
        </ButtonGroup>
      </div>

      <Card>
        {loading ? (
          <CardContent className='text-center py-12'>
            <Typography>Loading logs...</Typography>
          </CardContent>
        ) : filteredLogs.length === 0 ? (
          <CardContent className='text-center py-12'>
            <Typography color='text.secondary'>No logs found</Typography>
          </CardContent>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(log.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.source} size='small' color='primary' variant='outlined' />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{log.type}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        size='small'
                        color={
                          log.status === 'success'
                            ? 'success'
                            : log.status === 'error'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {log.errorMsg || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  )
}
