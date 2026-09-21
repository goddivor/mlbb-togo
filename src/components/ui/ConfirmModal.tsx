'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import Modal from './Modal';
import { Button } from './index';
import { cn } from '@/lib/helpers';

type Variant = 'danger' | 'warning' | 'info' | 'success';
type ButtonVariant = 'primary' | 'danger' | 'success';

const variantConfig: Record<
  Variant,
  { icon: ReactNode; confirmVariant: ButtonVariant; confirmClass?: string; iconBg: string }
> = {
  danger: {
    icon: <AlertTriangle size={24} className="text-danger" />,
    confirmVariant: 'danger',
    iconBg: 'bg-danger/10',
  },
  warning: {
    icon: <AlertTriangle size={24} className="text-warning" />,
    // No dedicated warning button variant: reuse primary base + warning color.
    confirmVariant: 'primary',
    confirmClass: 'bg-warning hover:bg-opacity-90',
    iconBg: 'bg-warning/10',
  },
  info: {
    icon: <Info size={24} className="text-primary" />,
    confirmVariant: 'primary',
    iconBg: 'bg-primary/10',
  },
  success: {
    icon: <CheckCircle2 size={24} className="text-success" />,
    confirmVariant: 'success',
    iconBg: 'bg-success/10',
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
  /** Backward-compatible alias: `danger` => variant "danger". */
  danger?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  closeLabel?: string;
}) {
  const resolved: Variant = variant ?? (danger ? 'danger' : 'info');
  const { icon, confirmVariant, confirmClass, iconBg } = variantConfig[resolved];

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
          <div className="flex-1 pt-1 text-sm text-body dark:text-bodydark">{message}</div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-stroke dark:border-strokedark">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            className={cn('flex-1', confirmClass)}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
