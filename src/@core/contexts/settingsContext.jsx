'use client'

import { createContext, useMemo, useState } from 'react'

// Config Imports
import themeConfig from '@configs/themeConfig'
import primaryColorConfig from '@configs/primaryColorConfig'

// Hook Imports
import { useObjectCookie } from '@core/hooks/useObjectCookie'

export const SettingsContext = createContext(null)

export const SettingsProvider = props => {
  const { children } = props

  const initialSettings = {
    mode: themeConfig.mode,
    skin: themeConfig.skin,
    semiDark: themeConfig.semiDark,
    layout: themeConfig.layout,
    layoutPadding: themeConfig.layoutPadding,
    compactContentWidth: themeConfig.compactContentWidth,
    navbar: themeConfig.navbar,
    contentWidth: themeConfig.contentWidth,
    footer: themeConfig.footer,
    disableRipple: themeConfig.disableRipple,
    toastPosition: themeConfig.toastPosition,
    primaryColor: primaryColorConfig[0].light
  }

  const [settings, setSettings] = useState(initialSettings)

  const updateSettings = settingsObj => {
    setSettings(prev => ({...prev, ...settingsObj}))
  }

  const resetSettings = () => {
    setSettings(initialSettings)
  }

  const isSettingsChanged = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettings),
    [settings, initialSettings]
  )

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isSettingsChanged
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
