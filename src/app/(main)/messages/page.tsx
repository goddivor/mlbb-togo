'use client';

import { MessageSquare } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui';
import MessagesInbox from '@/components/messages/MessagesInbox';

export default function MessagesPage() {
  const t = useT();
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader icon={<MessageSquare size={28} />} title={t('messages.title')} variant="cyan" />
      <MessagesInbox />
    </div>
  );
}
