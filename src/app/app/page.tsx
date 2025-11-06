'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/ui/components/DashboardLayout';

interface ConnectionStatus {
  shopify: boolean;
  trello: boolean;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  const [status, setStatus] = useState<ConnectionStatus>({
    shopify: false,
    trello: false,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // TODO: Fetch actual data from API
      setStatus({
        shopify: true,
        trello: false,
      });

      setActivities([
        {
          id: '1',
          type: 'info',
          message: 'Welcome to ShopiTrello!',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  status.shopify ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-gray-700">Shopify</span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  status.trello ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-gray-700">Trello</span>
            </div>
          </div>
          {!status.trello && (
            <div className="mt-4">
              <a
                href="/app/integrations/trello"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Connect Trello
              </a>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          {activities.length === 0 ? (
            <p className="text-gray-500">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <p className="text-gray-800">{activity.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/app/boards"
              className="p-4 border rounded hover:bg-gray-50 text-center"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-medium">Boards</div>
            </a>
            <a
              href="/app/mappings"
              className="p-4 border rounded hover:bg-gray-50 text-center"
            >
              <div className="text-2xl mb-2">🔗</div>
              <div className="text-sm font-medium">Mappings</div>
            </a>
            <a
              href="/app/logs"
              className="p-4 border rounded hover:bg-gray-50 text-center"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium">Logs</div>
            </a>
            <a
              href="/app/settings"
              className="p-4 border rounded hover:bg-gray-50 text-center"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium">Settings</div>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

