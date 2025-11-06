'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/ui/components/DashboardLayout';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { useAppBridge } from '@/lib/app-bridge-provider';
import { useToast } from '@/ui/components/Toast';

interface MappingConfig {
  newOrder?: {
    enabled: boolean;
    listId?: string;
  };
  orderFulfilled?: {
    enabled: boolean;
    targetListId?: string;
  };
  newProduct?: {
    enabled: boolean;
    listId?: string;
  };
  newCustomer?: {
    enabled: boolean;
    listId?: string;
  };
}

export default function MappingsPage() {
  const [mappings, setMappings] = useState<MappingConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);
  const [lists, setLists] = useState<{ [key: string]: any[] }>({});
  
  const { authenticatedFetch } = useAppBridge();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [mappingsRes, boardsRes] = await Promise.all([
        authenticatedFetch('/api/mappings'),
        authenticatedFetch('/api/trello/boards'),
      ]);

      const mappingsData = await mappingsRes.json();
      const boardsData = await boardsRes.json();

      setMappings(mappingsData.mappings || {});
      setBoards(boardsData.boards || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load mappings', true);
    } finally {
      setLoading(false);
    }
  }

  async function loadLists(boardId: string) {
    if (lists[boardId]) return;

    try {
      const response = await authenticatedFetch(`/api/trello/lists?boardId=${boardId}`);
      const data = await response.json();
      setLists(prev => ({ ...prev, [boardId]: data.lists || [] }));
    } catch (error) {
      console.error('Failed to load lists:', error);
    }
  }

  async function saveMappings() {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/mappings', {
        method: 'PUT',
        body: JSON.stringify({ mappings }),
      });

      if (!response.ok) throw new Error('Failed to save mappings');

      showToast('Mappings saved successfully!');
    } catch (error: any) {
      showToast(error.message || 'Failed to save mappings', true);
    } finally {
      setSaving(false);
    }
  }

  function updateMapping(key: keyof MappingConfig, field: string, value: any) {
    setMappings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  }

  if (loading) {
    return (
      <DashboardLayout title="Mappings">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mappings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Shopify → Trello Mappings</h1>
            <p className="text-gray-600 mt-1">Automate Trello actions based on Shopify events</p>
          </div>
          <button
            onClick={saveMappings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Mappings'}
          </button>
        </div>

        {/* New Order Mapping */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New Order → Create Card</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mappings.newOrder?.enabled || false}
                onChange={(e) => updateMapping('newOrder', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
          {mappings.newOrder?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target List
              </label>
              <input
                type="text"
                value={mappings.newOrder.listId || ''}
                onChange={(e) => updateMapping('newOrder', 'listId', e.target.value)}
                placeholder="Enter Trello List ID"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Order Fulfilled Mapping */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Order Fulfilled → Move Card</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mappings.orderFulfilled?.enabled || false}
                onChange={(e) => updateMapping('orderFulfilled', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
          {mappings.orderFulfilled?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target List
              </label>
              <input
                type="text"
                value={mappings.orderFulfilled.targetListId || ''}
                onChange={(e) => updateMapping('orderFulfilled', 'targetListId', e.target.value)}
                placeholder="Enter Trello List ID"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* New Product Mapping */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New Product → Create Card</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mappings.newProduct?.enabled || false}
                onChange={(e) => updateMapping('newProduct', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
          {mappings.newProduct?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target List
              </label>
              <input
                type="text"
                value={mappings.newProduct.listId || ''}
                onChange={(e) => updateMapping('newProduct', 'listId', e.target.value)}
                placeholder="Enter Trello List ID"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* New Customer Mapping */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New Customer → Create Card</h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mappings.newCustomer?.enabled || false}
                onChange={(e) => updateMapping('newCustomer', 'enabled', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
          {mappings.newCustomer?.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target List
              </label>
              <input
                type="text"
                value={mappings.newCustomer.listId || ''}
                onChange={(e) => updateMapping('newCustomer', 'listId', e.target.value)}
                placeholder="Enter Trello List ID"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 How to find List ID
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Open your board in Trello</li>
            <li>Add ".json" to the URL</li>
            <li>Find your list and copy its "id" field</li>
            <li>Paste it in the Target List field above</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}

