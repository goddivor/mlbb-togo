import toast from 'react-hot-toast';

type TFn = (key: string, params?: Record<string, any>) => string;

/** Toast matching the outcome of a manual game sync (`gameSyncStatus`). */
export function notifyGameSync(t: TFn, status?: string | null) {
  if (status === 'token_expired') toast.error(t('gameAccount.sync.token_expired'));
  else if (status === 'unavailable') toast.error(t('gameAccount.sync.unavailable'));
  else if (status === 'moonton_offline') toast(t('gameAccount.sync.moonton_offline'));
  else toast.success(t('gameAccount.sync.ok'));
}
