'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, ImagePlus, Link2, Lock, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  api,
  ApiError,
  avatarSrc,
  type MediaAsset,
  type MediaConfig,
  type MediaPurpose,
  type MediaUploadTicket,
} from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button } from '@/components/ui';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Shape = 'square' | 'round' | 'wide';

export interface ImageUploadProps {
  purpose: MediaPurpose;
  /** Record the image belongs to. When set, the API attaches the upload to it right away. */
  targetId?: string | null;
  /** Current image URL of the form. */
  value: string;
  /** Receives the delivered URL of an approved upload ('' when removed). */
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  shape?: Shape;
  /** The field may be emptied (false for a sponsor logo). */
  removable?: boolean;
  /** Admins only: keep the "paste a URL" fallback. */
  allowUrl?: boolean;
  /** Uploader only (no preview): each upload is handed to `onChange` (lists). */
  addOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

const DISABLED: MediaConfig = { enabled: false, maxBytes: 0, formats: [] };

// Upload config shared by every ImageUpload of the page. It is not kept while
// uploads are disabled (an admin may configure Cloudinary meanwhile), and it
// is reloaded after a failed upload or when the integrations page saves.
let configPromise: Promise<MediaConfig> | null = null;
const configListeners = new Set<(config: MediaConfig) => void>();

function loadConfig(force = false): Promise<MediaConfig> {
  if (!configPromise || force) {
    const p = api.media.config(force).catch(() => DISABLED);
    configPromise = p;
    p.then((config) => {
      if (!config.enabled && configPromise === p) configPromise = null;
      configListeners.forEach((listener) => listener(config));
    });
  }
  return configPromise;
}

/** Drops the cached upload config (e.g. Cloudinary settings saved) and refreshes mounted fields. */
export function invalidateMediaConfig() {
  configPromise = null;
  if (configListeners.size) loadConfig(true);
}

/** Error returned by Cloudinary itself (raw English message, never shown as is). */
class CloudinaryUploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

type Translate = ReturnType<typeof useT>;

/** User-facing message of a failed upload: known Cloudinary errors translated, anything else generic. */
function uploadErrorMessage(e: unknown, t: Translate, maxMb: number): string {
  if (e instanceof CloudinaryUploadError) {
    const raw = e.message;
    if (e.status === 0) return t('upload.errNetwork');
    if (/file size too large|too large/i.test(raw)) return t('upload.tooLarge', { max: maxMb });
    if (/invalid image|image file format|not allowed|unsupported|allowed format/i.test(raw)) return t('upload.badType');
    if (/stale request|expired|already exists/i.test(raw)) return t('upload.errExpired');
    if (/signature|api[_ ]?key|cloud[_ ]?name|disabled|account|unauthori[sz]ed|forbidden/i.test(raw)) {
      return t('upload.errUnavailable');
    }
    return t('upload.failed');
  }
  if (e instanceof ApiError) {
    // Our own validation / permission messages are meant for users; server-side
    // failures may carry Cloudinary details.
    if (e.status === 429) return e.message;
    if (e.status >= 500) return t('upload.errUnavailable');
    return e.message || t('upload.failed');
  }
  return t('upload.failed');
}

/** Posts the file straight to Cloudinary with the signed fields, reporting progress. */
function uploadToCloudinary(
  ticket: MediaUploadTicket,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ public_id: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', ticket.apiKey);
    for (const [k, v] of Object.entries(ticket.params)) form.append(k, String(v));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', ticket.uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        //
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.public_id) resolve(data);
      else reject(new CloudinaryUploadError(String(data?.error?.message || `HTTP ${xhr.status}`), xhr.status || -1));
    };
    xhr.onerror = () => reject(new CloudinaryUploadError('network', 0));
    xhr.send(form);
  });
}

const shapeBox: Record<Shape, string> = {
  square: 'h-28 w-28 rounded-lg',
  round: 'h-24 w-24 rounded-full',
  wide: 'aspect-[3/1] w-full rounded-lg',
};

/**
 * Image field backed by signed direct uploads to Cloudinary (#131): drag and
 * drop or click, preview, progress, client-side type/size check, replace and
 * remove, "pending approval" state. Falls back to a URL input for admins (or
 * a disabled explanation for players) when Cloudinary is not configured.
 */
export default function ImageUpload({
  purpose,
  targetId,
  value,
  onChange,
  label,
  hint,
  shape = 'square',
  removable = true,
  allowUrl = false,
  addOnly = false,
  disabled = false,
  className,
}: ImageUploadProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<MediaConfig | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<MediaAsset | null>(null);
  // 'pending' for a community team captain: he cannot remove the public logo either.
  const [reviewed, setReviewed] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [removing, setRemoving] = useState(false);
  // Asset uploaded in this session while the record does not exist yet.
  const [loose, setLoose] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const listener = (c: MediaConfig) => alive && setConfig(c);
    configListeners.add(listener);
    loadConfig().then(listener);
    return () => {
      alive = false;
      configListeners.delete(listener);
    };
  }, []);

  // Community team logos proposed by a captain wait for an admin.
  useEffect(() => {
    if (purpose !== 'team' || !targetId || !config?.enabled) return;
    let alive = true;
    api.media
      .target(purpose, targetId)
      .then((s) => {
        if (!alive) return;
        setPending(s.pending);
        setReviewed(s.uploadStatus === 'pending');
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [purpose, targetId, config?.enabled]);

  const busy = progress !== null || removing;
  const maxMb = config?.maxBytes ? Math.round(config.maxBytes / 1024 / 1024) : 8;

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !config?.enabled || disabled) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(t('upload.badType'));
        return;
      }
      if (config.maxBytes && file.size > config.maxBytes) {
        toast.error(t('upload.tooLarge', { max: maxMb }));
        return;
      }
      setProgress(0);
      try {
        const ticket = await api.media.sign(purpose, targetId);
        const uploaded = await uploadToCloudinary(ticket, file, setProgress);
        const result = await api.media.confirm(purpose, targetId, uploaded.public_id);
        if (result.status === 'pending') {
          setPending(result.asset);
          toast.success(t('upload.pendingSent'));
        } else {
          if (!targetId && !addOnly) setLoose({ id: result.asset.id, url: result.url });
          onChange(result.url);
          toast.success(t('upload.done'));
        }
      } catch (e) {
        toast.error(uploadErrorMessage(e, t, maxMb));
        // Cloudinary may have been removed or reconfigured meanwhile.
        loadConfig(true);
      } finally {
        setProgress(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [config, disabled, maxMb, onChange, purpose, targetId, addOnly, t],
  );

  const remove = async () => {
    setRemoving(true);
    try {
      if (targetId) {
        await api.media.removeFromTarget(purpose, targetId);
      } else if (loose && loose.url === value) {
        // Uploaded for a record that was never saved: clean it up.
        await api.media.remove(loose.id).catch(() => undefined);
        setLoose(null);
      }
      onChange('');
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setRemoving(false);
    }
  };

  const urlInput = (
    <input
      type="url"
      className="w-full rounded border border-line-strong bg-surface-1 px-4 py-2.5 text-sm text-ink-1 outline-none placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
      placeholder="https://"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  const labelEl = label ? <span className="mb-2.5 block text-sm font-medium text-ink-1">{label}</span> : null;

  // Loading the config: keep the layout stable.
  if (!config) {
    return (
      <div className={className}>
        {labelEl}
        <div className={`${addOnly ? 'h-12 w-full rounded-lg' : shapeBox[shape]} animate-pulse bg-surface-2`} />
      </div>
    );
  }

  // Cloudinary not configured: URL input for admins, explanation for players.
  if (!config.enabled) {
    return (
      <div className={className}>
        {labelEl}
        {allowUrl ? (
          <>
            {urlInput}
            <p className="mt-1.5 text-xs text-ink-3">{t('upload.urlOnly')}</p>
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-line-strong bg-surface-2/50 p-3 text-xs text-ink-3">
            <Lock size={14} className="mt-0.5 shrink-0" />
            {t('upload.unavailable')}
          </div>
        )}
      </div>
    );
  }

  const preview = value ? (value.includes('youngjoygame.com') ? avatarSrc(value, 400) : value) : '';
  const zoneHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (!busy && !disabled) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!busy) handleFile(e.dataTransfer.files?.[0]);
    },
  };
  const zoneState = dragging ? 'border-primary bg-primary/10' : 'border-line-strong bg-surface-2/50 hover:border-primary/60';

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_TYPES.join(',')}
      className="hidden"
      disabled={disabled || busy}
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  const progressBar =
    progress !== null ? (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={progress}>
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
    ) : null;

  if (addOnly) {
    return (
      <div className={className}>
        {labelEl}
        <button
          type="button"
          {...zoneHandlers}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-ink-2 transition-colors disabled:opacity-60 ${zoneState}`}
        >
          <UploadCloud size={16} />
          {progress !== null ? t('upload.uploading', { pct: progress }) : t('upload.addImage')}
        </button>
        {progressBar && <div className="mt-2">{progressBar}</div>}
        {fileInput}
      </div>
    );
  }

  return (
    <div className={className}>
      {labelEl}
      <div className={`flex gap-4 ${shape === 'wide' ? 'flex-col' : 'flex-col sm:flex-row sm:items-center'}`}>
        <button
          type="button"
          {...zoneHandlers}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          aria-label={value ? t('upload.replace') : t('upload.choose')}
          className={`group relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed transition-colors disabled:cursor-not-allowed ${shapeBox[shape]} ${zoneState}`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 px-2 text-center text-xs text-ink-3">
              <ImagePlus size={22} />
              {t('upload.drop')}
            </span>
          )}
          {preview && !busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <RefreshCw size={16} className="mr-1" /> {t('upload.replace')}
            </span>
          )}
          {progress !== null && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold text-white num">
              {progress}%
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {progressBar}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled || busy}>
              <UploadCloud size={14} />
              {value ? t('upload.replace') : t('upload.choose')}
            </Button>
            {value && removable && !reviewed && (
              <Button size="sm" variant="ghost" onClick={remove} loading={removing} disabled={disabled || busy}>
                <Trash2 size={14} className="text-accent-red" />
                <span className="text-accent-red">{t('upload.remove')}</span>
              </Button>
            )}
            {allowUrl && (
              <Button size="sm" variant="ghost" onClick={() => setShowUrl((s) => !s)} disabled={disabled}>
                <Link2 size={14} />
                {t('upload.pasteUrl')}
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-3">{hint ?? t('upload.limits', { max: maxMb })}</p>
          {pending && (
            <div className="flex flex-wrap items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pending.url} alt="" className="h-9 w-9 rounded object-cover ring-1 ring-accent-gold/40" />
              <Badge variant="gold" size="sm" className="gap-1">
                <Clock size={11} /> {t('upload.pending')}
              </Badge>
              <span className="text-xs text-ink-3">{t('upload.pendingHint')}</span>
            </div>
          )}
          {showUrl && allowUrl && urlInput}
        </div>
      </div>
      {fileInput}
    </div>
  );
}
