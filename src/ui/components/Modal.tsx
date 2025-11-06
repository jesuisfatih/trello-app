'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModalConfig {
  title: string;
  content: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalContextType {
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const showModal = useCallback((config: ModalConfig) => {
    setModal(config);
  }, []);

  const hideModal = useCallback(() => {
    setModal(null);
    setLoading(false);
  }, []);

  const handleConfirm = async () => {
    if (modal?.onConfirm) {
      setLoading(true);
      try {
        await modal.onConfirm();
        hideModal();
      } catch (error) {
        console.error('Modal confirm error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      hideModal();
    }
  };

  const handleCancel = () => {
    if (modal?.onCancel) {
      modal.onCancel();
    }
    hideModal();
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modal && (
        <ModalComponent
          {...modal}
          loading={loading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ModalContext.Provider>
  );
}

interface ModalComponentProps extends ModalConfig {
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ModalComponent({
  title,
  content,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  size = 'md',
  loading,
  onConfirm,
  onCancel,
}: ModalComponentProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 animate-scale-in`}>
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{content}</div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

