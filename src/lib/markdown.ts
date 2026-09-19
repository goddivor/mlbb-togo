/**
 * Tiny, dependency-free Markdown subset renderer for forum posts.
 *
 * Supported: paragraphs, `#`/`##`/`###` headings, `**bold**`, `_italic_` or
 * `*italic*`, `` `code` ``, `[label](https://url)`, bare https URLs, `- ` /
 * `* ` bullet lists, `1. ` ordered lists and line breaks. Everything is
 * HTML-escaped first and only http(s) links are emitted, so the output is
 * safe to inject with `dangerouslySetInnerHTML`.
 */

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SAFE_URL = /^https?:\/\/[^\s<>"']+$/i;

const link = (href: string, label: string): string =>
  SAFE_URL.test(href)
    ? `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline underline-offset-2 break-all">${label}</a>`
    : label;

/** Inline formatting on an already-escaped line. */
function renderInline(text: string): string {
  let out = text;
  // Inline code first so its content is not formatted further.
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-gray-2 px-1 py-0.5 text-[0.85em] dark:bg-meta-4">$1</code>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => link(href, label));
  // Bare URLs (not already inside an href / anchor).
  out = out.replace(/(^|[\s(])((?:https?:\/\/)[^\s<>"')]+)/g, (_m, pre, url) => `${pre}${link(url, url)}`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  return out;
}

export function renderMarkdown(source: string): string {
  const lines = escapeHtml(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];

  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };
  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${paragraph.map(renderInline).join('<br />')}</p>`);
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      const cls = level === 1 ? 'text-xl font-bold' : level === 2 ? 'text-lg font-bold' : 'text-base font-semibold';
      html.push(`<h${level + 2} class="${cls}">${renderInline(heading[2])}</h${level + 2}>`);
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      const kind: 'ul' | 'ol' = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        list = kind;
        html.push(kind === 'ul' ? '<ul class="list-disc pl-5 space-y-0.5">' : '<ol class="list-decimal pl-5 space-y-0.5">');
      }
      html.push(`<li>${renderInline((bullet ?? ordered)![1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line);
  }
  flushParagraph();
  closeList();
  return html.join('\n');
}

/** Plain-text preview (strips markdown markers) for card excerpts. */
export function markdownToText(source: string): string {
  return (source ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-\d.)]+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
