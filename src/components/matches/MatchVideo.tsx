'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Radio, Video } from 'lucide-react';
import { TFn, twitchEmbed, youtubeId } from './shared';

/**
 * Embedded VOD / stream: YouTube and Twitch links are embedded, anything
 * else is offered as an external link.
 */
export default function MatchVideo({
  url,
  kind,
  t,
}: {
  url: string;
  kind: 'vod' | 'stream';
  t: TFn;
}) {
  const yt = youtubeId(url);
  // Twitch needs the current hostname (parent param): resolve after mount.
  const [twitch, setTwitch] = useState<string | null>(null);
  useEffect(() => {
    setTwitch(twitchEmbed(url));
  }, [url]);

  const embed = yt ? `https://www.youtube.com/embed/${yt}` : twitch;
  const Icon = kind === 'stream' ? Radio : Video;
  const label = t(kind === 'stream' ? 'matches.links.stream' : 'matches.links.vod');

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center gap-2 border-b border-stroke px-4 py-3 dark:border-strokedark">
        <Icon size={16} className={kind === 'stream' ? 'text-danger' : 'text-primary'} />
        <span className="text-sm font-semibold text-black dark:text-white">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink size={12} /> {t('matches.links.open')}
        </a>
      </div>
      {embed ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embed}
            title={label}
            className="h-full w-full"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-body hover:text-primary dark:text-bodydark"
        >
          <Icon size={20} /> {t('matches.links.external')}
        </a>
      )}
    </div>
  );
}
