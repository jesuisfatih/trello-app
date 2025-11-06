const shopytrelloMenu = () => [
  {
    label: 'Dashboard',
    href: '/app',
    icon: 'tabler-smart-home'
  },
  {
    label: 'Integrations',
    icon: 'tabler-plug',
    children: [
      {
        label: 'Trello',
        href: '/app/integrations/trello',
        icon: 'tabler-brand-trello'
      }
    ]
  },
  {
    label: 'Trello',
    icon: 'tabler-checklist',
    children: [
      {
        label: 'Boards',
        href: '/app/boards',
        icon: 'tabler-layout-board'
      }
    ]
  },
  {
    label: 'Automation',
    icon: 'tabler-git-merge',
    children: [
      {
        label: 'Mappings',
        href: '/app/mappings',
        icon: 'tabler-arrows-exchange'
      }
    ]
  },
  {
    label: 'Monitoring',
    icon: 'tabler-activity',
    children: [
      {
        label: 'Event Logs',
        href: '/app/logs',
        icon: 'tabler-file-text'
      }
    ]
  },
  {
    label: 'Settings',
    href: '/app/settings',
    icon: 'tabler-settings'
  }
]

export default shopytrelloMenu

