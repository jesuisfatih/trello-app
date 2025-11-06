'use client'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
      >
        <MenuItem href='/app' icon={<i className='tabler-smart-home' />}>
          Dashboard
        </MenuItem>
        
        <SubMenu label='Integrations' icon={<i className='tabler-plug' />}>
          <MenuItem href='/app/integrations/trello' icon={<i className='tabler-brand-trello' />}>
            Trello
          </MenuItem>
        </SubMenu>

        <SubMenu label='Trello' icon={<i className='tabler-checklist' />}>
          <MenuItem href='/app/boards' icon={<i className='tabler-layout-board' />}>
            Boards
          </MenuItem>
        </SubMenu>

        <SubMenu label='Automation' icon={<i className='tabler-git-merge' />}>
          <MenuItem href='/app/mappings' icon={<i className='tabler-arrows-exchange' />}>
            Mappings
          </MenuItem>
        </SubMenu>

        <SubMenu label='Monitoring' icon={<i className='tabler-activity' />}>
          <MenuItem href='/app/logs' icon={<i className='tabler-file-text' />}>
            Event Logs
          </MenuItem>
        </SubMenu>

        <MenuItem href='/app/settings' icon={<i className='tabler-settings' />}>
          Settings
        </MenuItem>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
