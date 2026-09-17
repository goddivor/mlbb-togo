'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/helpers';
import { renderMarkdown } from '@/lib/markdown';

/** Renders post content: markdown subset (sanitized) or plain text. */
export default function MarkdownContent({
  content,
  format,
  className,
}: {
  content: string;
  format?: string | null;
  className?: string;
}) {
  const html = useMemo(
    () => (format === 'markdown' ? renderMarkdown(content) : null),
    [content, format],
  );
  const base = 'text-sm leading-relaxed text-body dark:text-bodydark space-y-2 break-words';
  if (html === null) {
    return <div className={cn(base, 'whitespace-pre-wrap', className)}>{content}</div>;
  }
  return <div className={cn(base, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
