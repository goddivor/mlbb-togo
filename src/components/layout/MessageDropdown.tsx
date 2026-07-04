'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { timeAgo, truncateText } from '@/lib/helpers';
import { getSocket, usePresence } from '@/lib/realtime';
import { Avatar } from '@/components/ui';

interface MessageDropdownProps {
  /** Where the icon and every row link to (player: /messages, admin: /admin/messages). */
  href?: string;
}

const nameOf = (o: any): string => o?.displayName || o?.username || '';

/**
 * TailAdmin "Messages" dropdown (see partials/header.html): round icon button
 * with the exact chat SVG plus a red dot on incoming messages, and a dropdown
 * listing the latest threads (avatar, other party's name, truncated last
 * message, relative time). Threads come from `api.messages.threads`; a
 * `message:new` socket event keeps the list and the dot live. Every row and
 * the footer button link to the messages page.
 */
export default function MessageDropdown({ href = '/messages' }: MessageDropdownProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [notifying, setNotifying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const connected = usePresence((s) => s.connected);

  const loadThreads = () =>
    api.messages
      .threads()
      .then((l: any) => setThreads(Array.isArray(l) ? l : []))
      .catch(() => {});

  // Initial load so the dropdown is ready before the first open.
  useEffect(() => {
    loadThreads();
  }, []);

  // Refresh the list each time the dropdown opens and clear the dot.
  useEffect(() => {
    if (open) {
      loadThreads();
      setNotifying(false);
    }
  }, [open]);

  // Live messages (WebSocket): refresh the list and flag the dot.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onMsg = () => {
      setNotifying(true);
      loadThreads();
    };
    s.on('message:new', onMsg);
    return () => {
      s.off('message:new', onMsg);
    };
  }, [connected]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('header.messages')}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray text-black hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        {notifying && (
          <span className="absolute right-2.5 top-2.5 z-1 h-2 w-2 rounded-full bg-meta-1">
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75" />
          </span>
        )}

        <svg
          className="fill-current duration-300 ease-in-out"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.9688 1.57495H7.03135C3.43135 1.57495 0.506348 4.41558 0.506348 7.90308C0.506348 11.3906 2.75635 13.8375 8.26885 16.3125C8.40947 16.3687 8.52197 16.3968 8.6626 16.3968C8.85947 16.3968 9.02822 16.3406 9.19697 16.2281C9.47822 16.0593 9.64697 15.75 9.64697 15.4125V14.2031H10.9688C14.5688 14.2031 17.522 11.3625 17.522 7.87495C17.522 4.38745 14.5688 1.57495 10.9688 1.57495ZM10.9688 12.9937H9.3376C8.80322 12.9937 8.35322 13.4437 8.35322 13.9781V15.0187C3.6001 12.825 1.74385 10.8 1.74385 7.9312C1.74385 5.14683 4.10635 2.8687 7.03135 2.8687H10.9688C13.8657 2.8687 16.2563 5.14683 16.2563 7.9312C16.2563 10.7156 13.8657 12.9937 10.9688 12.9937Z"
            fill=""
          />
          <path
            d="M5.42812 7.28442C5.0625 7.28442 4.78125 7.56567 4.78125 7.9313C4.78125 8.29692 5.0625 8.57817 5.42812 8.57817C5.79375 8.57817 6.075 8.29692 6.075 7.9313C6.075 7.56567 5.79375 7.28442 5.42812 7.28442Z"
            fill=""
          />
          <path
            d="M9.00015 7.28442C8.63452 7.28442 8.35327 7.56567 8.35327 7.9313C8.35327 8.29692 8.63452 8.57817 9.00015 8.57817C9.33765 8.57817 9.64702 8.29692 9.64702 7.9313C9.64702 7.56567 9.33765 7.28442 9.00015 7.28442Z"
            fill=""
          />
          <path
            d="M12.5719 7.28442C12.2063 7.28442 11.925 7.56567 11.925 7.9313C11.925 8.29692 12.2063 8.57817 12.5719 8.57817C12.9375 8.57817 13.2188 8.29692 13.2188 7.9313C13.2188 7.56567 12.9094 7.28442 12.5719 7.28442Z"
            fill=""
          />
        </svg>
      </button>

      {open && (
        <div className="absolute -right-16 mt-2.5 flex h-90 w-80 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0">
          <div className="px-4.5 py-3">
            <h5 className="text-sm font-medium text-bodydark2">{t('header.messages')}</h5>
          </div>

          <ul className="flex flex-1 flex-col overflow-y-auto">
            {threads.length === 0 ? (
              <li className="flex flex-1 items-center justify-center px-4.5 py-6 text-center text-sm text-body dark:text-bodydark">
                {t('messages.none')}
              </li>
            ) : (
              threads.map((th) => {
                const o = th.other;
                return (
                  <li key={th.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex gap-4.5 border-t border-stroke px-4.5 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                    >
                      <Avatar
                        name={nameOf(o)}
                        src={o?.avatar ? avatarSrc(o.avatar, 64) : undefined}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <h6 className="truncate text-sm font-medium text-black dark:text-white">
                          {nameOf(o) || th.subject || ''}
                        </h6>
                        <p className="truncate text-sm text-body dark:text-bodydark">
                          {truncateText(th.lastMessage?.body || '', 32)}
                        </p>
                        <p className="text-xs">{timeAgo(th.lastMessageAt)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          <Link
            href={href}
            onClick={() => setOpen(false)}
            className="border-t border-stroke px-4.5 py-3 text-center text-sm font-medium text-primary hover:underline dark:border-strokedark"
          >
            {t('header.viewAllMessages')}
          </Link>
        </div>
      )}
    </div>
  );
}
