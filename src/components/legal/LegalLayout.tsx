'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, List } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import PublicShell from '@/components/landing/PublicShell';
import { getLegalCatalogue, LEGAL_SLUGS, type LegalSlug } from '@/content/legal';
import { ORGANISATION } from '@/content/organisation';

/**
 * Shared layout of the legal pages: localized content, table of contents
 * (with active section tracking), last-updated date and sibling navigation.
 */
export default function LegalLayout({ slug }: { slug: LegalSlug }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const catalogue = useMemo(() => getLegalCatalogue(lang), [lang]);
  const page = catalogue[slug];
  const [active, setActive] = useState<string>(page.sections[0]?.id ?? '');

  const updated = useMemo(
    () =>
      new Date(ORGANISATION.legalUpdatedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [lang],
  );

  // Highlight the section currently in view in the table of contents.
  useEffect(() => {
    const els = page.sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [page]);

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <header className="max-w-3xl mb-10">
          <p className="eyebrow mb-3">{t('legal.eyebrow')}</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight2 text-ink-1 leading-[0.95]">{page.title}</h1>
          <p className="text-ink-2 mt-4 leading-relaxed">{page.intro}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink-3">
            <CalendarClock size={14} />
            {t('legal.updated')} {updated}
          </p>
        </header>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          <aside className="lg:sticky lg:top-28 self-start space-y-6">
            <nav aria-label={t('legal.toc')} className="rounded-lg border border-line-subtle bg-surface-1 p-5 shadow-elev-1">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3 mb-3">
                <List size={14} /> {t('legal.toc')}
              </p>
              <ol className="space-y-1.5">
                {page.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={active === s.id ? 'location' : undefined}
                      className={`block text-sm rounded-md px-2 py-1 transition-colors ${
                        active === s.id
                          ? 'text-primary bg-primary/10'
                          : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                      }`}
                    >
                      <span className="text-ink-3 mr-2 num">{i + 1}.</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <nav aria-label={t('legal.otherPages')} className="rounded-lg border border-line-subtle bg-surface-1 p-5 shadow-elev-1">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3 mb-3">
                {t('legal.otherPages')}
              </p>
              <ul className="space-y-1.5">
                {LEGAL_SLUGS.map((s) => (
                  <li key={s}>
                    <Link
                      href={`/legal/${s}`}
                      aria-current={s === slug ? 'page' : undefined}
                      className={`block text-sm rounded-md px-2 py-1 transition-colors ${
                        s === slug ? 'text-ink-1 font-semibold' : 'text-ink-2 hover:text-primary'
                      }`}
                    >
                      {catalogue[s].label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1 p-6 sm:p-10">
            {page.sections.map((s, i) => (
              <section key={s.id} id={s.id} className={`scroll-mt-28 ${i > 0 ? 'mt-10 pt-10 border-t border-line-subtle' : ''}`}>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight2 text-ink-1 mb-4">
                  <span className="text-primary mr-2 num">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="space-y-4 text-sm sm:text-base text-ink-2 leading-relaxed">
                  {s.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {s.bullets && (
                    <ul className="list-disc pl-5 space-y-2 marker:text-primary">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            <footer className="mt-10 pt-6 border-t border-line-subtle text-xs text-ink-3">
              {t('legal.contactHint')}{' '}
              <a href={`mailto:${ORGANISATION.contactEmail}`} className="text-primary hover:underline">
                {ORGANISATION.contactEmail}
              </a>
            </footer>
          </article>
        </div>
      </div>
    </PublicShell>
  );
}
