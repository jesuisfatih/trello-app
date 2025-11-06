'use client'

import { ReactNode, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Link2, 
  FileText, 
  Settings, 
  Plug2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

// Context Imports
import { AppBridgeProvider } from '@/lib/app-bridge-provider'
import { ToastProvider } from '@/ui/components/Toast'
import { ModalProvider } from '@/ui/components/Modal'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Boards', href: '/app/boards', icon: FolderKanban },
  { name: 'Mappings', href: '/app/mappings', icon: Link2 },
  { name: 'Logs', href: '/app/logs', icon: FileText },
  { name: 'Integrations', href: '/app/integrations/trello', icon: Plug2 },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <ErrorBoundary>
        <AppBridgeProvider>
          <ToastProvider>
            <ModalProvider>
              <div className="flex h-screen bg-gray-50">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:flex lg:flex-shrink-0">
                  <div className="flex flex-col w-64">
                    <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
                      {/* Logo */}
                      <div className="flex items-center flex-shrink-0 px-4 mb-8">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xl font-bold text-gray-900">ShopiTrello</span>
                        </div>
                      </div>

                      {/* Navigation */}
                      <nav className="flex-1 px-3 space-y-1">
                        {navigation.map((item) => {
                          const isActive = pathname === item.href || 
                            (item.href !== '/app' && pathname?.startsWith(item.href))
                          const Icon = item.icon
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={clsx(
                                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                                isActive
                                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              )}
                            >
                              <Icon className={clsx(
                                'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                              )} />
                              {item.name}
                              {isActive && (
                                <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                              )}
                            </Link>
                          )
                        })}
                      </nav>
                    </div>
                  </div>
                </aside>

                {/* Mobile Sidebar */}
                {sidebarOpen && (
                  <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                    <div className="relative flex flex-col w-full max-w-xs bg-white">
                      <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                          onClick={() => setSidebarOpen(false)}
                          className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                          <X className="h-6 w-6 text-white" />
                        </button>
                      </div>
                      <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4 mb-8">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <FolderKanban className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">ShopiTrello</span>
                          </div>
                        </div>
                        <nav className="px-3 space-y-1">
                          {navigation.map((item) => {
                            const isActive = pathname === item.href || 
                              (item.href !== '/app' && pathname?.startsWith(item.href))
                            const Icon = item.icon
                            
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={clsx(
                                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                                  isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                )}
                              >
                                <Icon className={clsx(
                                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                )} />
                                {item.name}
                              </Link>
                            )
                          })}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Top Navbar */}
                  <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
                    <button
                      type="button"
                      className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 px-4 flex justify-between items-center">
                      <div className="flex-1 flex">
                        <h1 className="text-lg font-semibold text-gray-900">
                          {navigation.find(item => 
                            pathname === item.href || 
                            (item.href !== '/app' && pathname?.startsWith(item.href))
                          )?.name || 'Dashboard'}
                        </h1>
                      </div>
                      <div className="ml-4 flex items-center md:ml-6">
                        {/* User dropdown placeholder */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          U
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page Content */}
                  <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <div className="py-6 px-4 sm:px-6 lg:px-8">
                      {children}
                    </div>
                  </main>
                </div>
              </div>
            </ModalProvider>
          </ToastProvider>
        </AppBridgeProvider>
      </ErrorBoundary>
    </>
  )
}
