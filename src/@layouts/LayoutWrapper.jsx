'use client'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'

const LayoutWrapper = props => {
  // Props
  const { systemMode, verticalLayout } = props

  // Hooks
  const { settings } = useSettings()

  useLayoutInit(systemMode)

  // Return vertical layout only (ShopiTrello uses vertical layout)
  return (
    <div className='flex flex-col flex-auto' data-skin={settings.skin}>
      {verticalLayout}
    </div>
  )
}

export default LayoutWrapper
