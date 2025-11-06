'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { href: '/app', label: 'Dashboard', icon: '🏠' },
  { href: '/app/integrations/trello', label: 'Trello', icon: '🔗' },
  { href: '/app/boards', label: 'Boards', icon: '📋' },
  { href: '/app/mappings', label: 'Mappings', icon: '🔀' },
  { href: '/app/logs', label: 'Logs', icon: '📝' },
  { href: '/app/settings', label: 'Settings', icon: '⚙️' },
];

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">ShopiTrello</h1>
            <p className="text-sm text-gray-500">Shopify × Trello</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              v1.0.0 • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        {title && (
          <header className="bg-white border-b px-8 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          </header>
        )}

        {/* Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

