'use client';

import Modal from './Modal';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  closeLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md" closeLabel={closeLabel}>
      <p className="text-sm text-gray-300">{message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gaming-border text-gray-300 hover:bg-gaming-surface transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
            danger
              ? 'bg-red-500/90 hover:bg-red-500 text-white'
              : 'bg-neon-blue hover:bg-neon-blue/90 text-gaming-dark'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
