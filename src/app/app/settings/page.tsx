'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/ui/components/DashboardLayout';

export default function SettingsPage() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  async function testConnections() {
    setTesting(true);
    setTestResults(null);

    try {
      // Test Shopify connection
      const shopifyResult = await fetch('/api/health').then((r) => r.json());

      // TODO: Test Trello connection
      const trelloResult = { status: 'pending' };

      setTestResults({
        shopify: shopifyResult,
        trello: trelloResult,
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResults({ error: 'Failed to test connections' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* API Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">API Status</h2>
          <button
            onClick={testConnections}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Connections'}
          </button>

          {testResults && (
            <div className="mt-4 space-y-2">
              {testResults.error ? (
                <div className="p-3 bg-red-50 text-red-700 rounded">
                  {testResults.error}
                </div>
              ) : (
                <>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">Shopify</span>
                      <span
                        className={`${
                          testResults.shopify?.status === 'ok'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {testResults.shopify?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">Trello</span>
                      <span className="text-yellow-600">
                        {testResults.trello?.status || 'Not tested'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Webhook Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Webhook Settings</h2>
          <p className="text-gray-600 mb-4">
            Webhooks are automatically configured when you connect your accounts.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Shopify Webhooks</span>
              <span className="text-green-600">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Trello Webhooks</span>
              <span className="text-gray-500">Not configured</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">App Version</dt>
              <dd className="font-medium">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">API Version</dt>
              <dd className="font-medium">2025-10</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Node Version</dt>
              <dd className="font-medium">{process.version || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </DashboardLayout>
  );
}

