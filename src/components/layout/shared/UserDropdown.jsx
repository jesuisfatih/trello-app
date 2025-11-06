'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
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

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef(null)

  const handleDropdownOpen = () => {
    setOpen(true)
  }

  const handleDropdownClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          alt='Admin'
          src='/images/avatars/1.png'
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
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
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className='shadow-lg'>
              <ClickAwayListener onClickAway={handleDropdownClose}>
                <MenuList>
                  <div className='flex items-start px-6 pt-3.5 pb-2.5 gap-3'>
                    <Badge
                      overlap='circular'
                      badgeContent={<BadgeContentSpan />}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar alt='Admin' src='/images/avatars/1.png' />
                    </Badge>
                    <div className='flex items-center justify-between is-full gap-2'>
                      <div className='flex flex-col gap-0.5'>
                        <Typography className='font-medium' color='text.primary'>
                          Admin
                        </Typography>
                        <Typography variant='caption'>Merchant</Typography>
                      </div>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='mli-2 gap-3' href='/app/settings'>
                    <i className='tabler-settings text-[22px]' />
                    <Typography color='text.primary'>Settings</Typography>
                  </MenuItem>
                  <MenuItem className='mli-2 gap-3' href='/app'>
                    <i className='tabler-smart-home text-[22px]' />
                    <Typography color='text.primary'>Dashboard</Typography>
                  </MenuItem>
                  <Divider className='mlb-1' />
                  <MenuItem
                    className='mli-2 gap-3'
                    onClick={handleDropdownClose}
                  >
                    <i className='tabler-help text-[22px]' />
                    <Typography color='text.primary'>Help</Typography>
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
