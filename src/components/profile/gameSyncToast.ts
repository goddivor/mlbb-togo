import toast from 'react-hot-toast';

type TFn = (key: string, params?: Record<string, any>) => string;

/**
 * Toast matching the outcome of a manual game sync (`gameSyncStatus`). A
 * legacy `moonton_offline` status counts as a successful profile sync.
 */
export function notifyGameSync(t: TFn, status?: string | null) {
  if (status === 'token_expired') toast.error(t('gameAccount.sync.token_expired'));
  else if (status === 'unavailable') toast.error(t('gameAccount.sync.unavailable'));
  else toast.success(t('gameAccount.sync.profileOk'));
}
