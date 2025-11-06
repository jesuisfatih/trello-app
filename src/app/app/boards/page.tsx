'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/ui/components/DashboardLayout';

interface Board {
  id: string;
  name: string;
  desc: string;
  url: string;
  closed: boolean;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    try {
      // TODO: Get session token from App Bridge
      const sessionToken = 'dummy-token';

      const response = await fetch('/api/trello/boards', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load boards');
      }

      const data = await response.json();
      setBoards(data.boards || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Boards">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading boards...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Boards">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadBoards}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Boards">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Trello Boards</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No boards found</p>
            <a
              href="/app/integrations/trello"
              className="text-blue-600 hover:underline"
            >
              Connect Trello to get started
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{board.name}</h3>
                {board.desc && (
                  <p className="text-gray-600 text-sm mb-3">{board.desc}</p>
                )}
                <div className="flex space-x-2">
                  <a
                    href={`/app/boards/${board.id}`}
                    className="flex-1 text-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    View
                  </a>
                  <a
                    href={board.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                  >
                    Open in Trello
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

