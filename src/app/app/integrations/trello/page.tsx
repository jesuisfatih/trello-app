'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/ui/components/DashboardLayout';

export default function TrelloIntegrationPage() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success === 'true') {
      setConnected(true);
    }

    if (errorParam) {
      setError('Failed to connect to Trello. Please try again.');
    }
  }, [searchParams]);

  async function handleConnect() {
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/trello/oauth/start');
      const data = await response.json();

      if (data.authorizeUrl) {
        window.location.href = data.authorizeUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth flow');
      setConnecting(false);
    }
  }

  return (
    <DashboardLayout title="Trello Integration">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold mb-2">Connect to Trello</h2>
            <p className="text-gray-600">
              Connect your Trello account to sync boards, lists, and cards with
              your Shopify store.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {connected && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700">
                Successfully connected to Trello!
              </p>
            </div>
          )}

          {!connected && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">What you can do:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Create and manage Trello boards</li>
                  <li>Add, update, and move cards</li>
                  <li>Add comments to cards</li>
                  <li>Assign members to cards</li>
                  <li>Set up webhooks for real-time sync</li>
                </ul>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? 'Connecting...' : 'Connect Trello Account'}
              </button>
            </div>
          )}

          {connected && (
            <div className="mt-6 text-center">
              <a
                href="/app/boards"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Boards
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

