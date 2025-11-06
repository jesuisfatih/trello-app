'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/ui/components/DashboardLayout';

interface List {
  id: string;
  name: string;
  closed: boolean;
}

interface Card {
  id: string;
  name: string;
  desc: string;
  idList: string;
  due?: string;
  closed: boolean;
}

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  
  const [board, setBoard] = useState<any>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<{ [key: string]: Card[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      loadBoardData();
    }
  }, [boardId]);

  async function loadBoardData() {
    try {
      // TODO: Get session token from App Bridge
      const sessionToken = 'dummy-token';
      const headers = { Authorization: `Bearer ${sessionToken}` };

      // Load board details
      const boardRes = await fetch(`/api/trello/boards/${boardId}`, { headers });
      if (!boardRes.ok) throw new Error('Failed to load board');
      const boardData = await boardRes.json();
      setBoard(boardData.board);

      // Load lists
      const listsRes = await fetch(`/api/trello/lists?boardId=${boardId}`, { headers });
      if (!listsRes.ok) throw new Error('Failed to load lists');
      const listsData = await listsRes.json();
      setLists(listsData.lists || []);

      // Load cards for each list
      const cardsMap: { [key: string]: Card[] } = {};
      for (const list of listsData.lists || []) {
        const cardsRes = await fetch(`/api/trello/cards?listId=${list.id}`, { headers });
        if (cardsRes.ok) {
          const cardsData = await cardsRes.json();
          cardsMap[list.id] = cardsData.cards || [];
        }
      }
      setCards(cardsMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load board data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Board Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading board...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !board) {
    return (
      <DashboardLayout title="Board Details">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error || 'Board not found'}</p>
          <a href="/app/boards" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Boards
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={board.name}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <a href="/app/boards" className="text-blue-600 hover:underline text-sm">
              ← Back to Boards
            </a>
            <h1 className="text-2xl font-bold mt-2">{board.name}</h1>
            {board.desc && <p className="text-gray-600">{board.desc}</p>}
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create List
          </button>
        </div>

        {/* Lists and Cards */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">{list.name}</h3>
                <span className="text-sm text-gray-500">
                  {cards[list.id]?.length || 0}
                </span>
              </div>

              <div className="space-y-2">
                {(cards[list.id] || []).map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h4 className="font-medium text-sm">{card.name}</h4>
                    {card.desc && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {card.desc}
                      </p>
                    )}
                    {card.due && (
                      <p className="text-xs text-orange-600 mt-1">
                        Due: {new Date(card.due).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}

                <button className="w-full py-2 text-sm text-gray-600 hover:bg-gray-200 rounded">
                  + Add Card
                </button>
              </div>
            </div>
          ))}

          {lists.length === 0 && (
            <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-3">No lists yet</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Create First List
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

