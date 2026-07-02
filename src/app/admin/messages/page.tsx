'use client';

import { useT } from '@/lib/i18n';
import MessagesInbox from '@/components/messages/MessagesInbox';

export default function AdminMessagesPage() {
  const t = useT();
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
        {t('messages.title')}
      </h1>
      <MessagesInbox />
    </div>
  );
}
