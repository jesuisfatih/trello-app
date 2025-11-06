'use client'

import { useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'

const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={() => setOpen(!open)} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          alt='Merchant'
          onClick={() => setOpen(!open)}
          className='cursor-pointer bs-[38px] is-[38px]'
        >
          M
        </Avatar>
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}
          >
            <Paper className='shadow-lg'>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2'>
                    <Avatar alt='Merchant'>M</Avatar>
                    <div>
                      <Typography className='font-medium'>Merchant</Typography>
                      <Typography variant='caption'>Admin</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem onClick={() => window.location.href = '/app/settings'}>
                    <i className='tabler-settings text-xl mie-2' />
                    <Typography>Settings</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => window.location.href = '/app'}>
                    <i className='tabler-smart-home text-xl mie-2' />
                    <Typography>Dashboard</Typography>
                  </MenuItem>
                  <Divider className='mlb-1' />
                  <MenuItem onClick={() => setOpen(false)}>
                    <i className='tabler-help text-xl mie-2' />
                    <Typography>Help</Typography>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
