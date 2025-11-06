'use client'

import { useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles'

// Component Imports
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Style Imports
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  background: `linear-gradient(var(--mui-palette-background-paper) 5%, rgb(var(--mui-palette-background-paperChannel) / 0.85) 30%, rgb(var(--mui-palette-background-paperChannel) / 0.5) 65%, rgb(var(--mui-palette-background-paperChannel) / 0.3) 75%, transparent)`,
  '&.scrolled': {
    opacity: 1
  }
}))

const Navigation = () => {
  const verticalNavOptions = useVerticalNav()
  const { settings } = useSettings()
  const shadowRef = useRef(null)

  useEffect(() => {
    if (settings.layout === 'collapsed') {
      // Keep vertical layout
    }
  }, [settings.layout])

  const scrollMenu = (container, isPerfectScrollbar) => {
    container = verticalNavOptions.isBreakpointReached || !isPerfectScrollbar ? container.target : container

    if (shadowRef && container.scrollTop > 0) {
      if (!shadowRef.current.classList.contains('scrolled')) {
        shadowRef.current.classList.add('scrolled')
      }
    } else {
      shadowRef.current.classList.remove('scrolled')
    }
  }

  return (
    <VerticalNav
      customStyles={navigationCustomStyles(verticalNavOptions)}
      collapsedWidth={71}
      backgroundColor='var(--mui-palette-background-paper)'
    >
      <NavHeader>
        <Logo />
      </NavHeader>
      <StyledBoxForShadow ref={shadowRef} />
      <VerticalMenu scrollMenu={scrollMenu} />
    </VerticalNav>
  )
}

export default Navigation
