'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import Modal from './Modal';
import { SpinLoader } from './index';
import { cn } from '@/lib/helpers';

type Variant = 'danger' | 'warning' | 'info' | 'success';

const variantConfig: Record<
  Variant,
  { icon: ReactNode; confirmClass: string; iconBg: string }
> = {
  danger: {
    icon: <AlertTriangle size={24} className="text-red-400" />,
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    iconBg: 'bg-red-500/15',
  },
  warning: {
    icon: <AlertTriangle size={24} className="text-amber-400" />,
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    iconBg: 'bg-amber-500/15',
  },
  info: {
    icon: <Info size={24} className="text-neon-blue" />,
    confirmClass: 'bg-gradient-to-r from-neon-blue to-neon-purple text-white',
    iconBg: 'bg-neon-blue/15',
  },
  success: {
    icon: <CheckCircle2 size={24} className="text-emerald-400" />,
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    iconBg: 'bg-emerald-500/15',
  },
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant,
  danger = false,
  loading = false,
  loadingLabel = 'En cours...',
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  /** Alias rétrocompatible : `danger` => variant "danger". */
  danger?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  closeLabel?: string;
}) {
  const resolved: Variant = variant ?? (danger ? 'danger' : 'info');
  const { icon, confirmClass, iconBg } = variantConfig[resolved];

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      closeLabel={closeLabel}
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
              iconBg
            )}
          >
            {icon}
          </div>
          <div className="flex-1 pt-1 text-sm text-gray-300">{message}</div>
        </div>
        <div className="flex gap-3 pt-2 border-t border-gaming-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gaming-border rounded-lg font-semibold text-gray-300 hover:bg-gaming-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
              confirmClass
            )}
          >
            {loading ? (
              <>
                <SpinLoader />
                <span>{loadingLabel}</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
