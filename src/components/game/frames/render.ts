import type { FrameInfo } from './catalog';
import { resetLocalIds, type FxSpec } from './geometry';

export interface FrameLayers {
  /** Rotating conic halo drawn behind everything (HTML layer). */
  fx: FxSpec | null;
  /** SVG markup drawn under the avatar (128 view box). */
  under: string;
  /** SVG markup drawn over the avatar (128 view box). */
  over: string;
}

/** Point every paint reference at the prefixed shared definitions. */
const prefixRefs = (markup: string): string => markup.replace(/url\(#/g, 'url(#mlf-');

/**
 * Render the layers of a frame. `uid` must be unique per instance on the page
 * and stable between server and client (use React `useId`): it scopes the
 * local clip paths of the square glint. The variant only feeds the season
 * plate of `champion_saison` / `mvp_saison`: it is reduced to `S<digits>`
 * by the plate helper, anything else falls back to the default plate text.
 */
export function renderFrameLayers(frame: FrameInfo, variant: string, uid: string): FrameLayers {
  const f = frame.raw;
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '') || 'f';
  resetLocalIds(safeUid);
  const under = f.under ? prefixRefs(f.under(variant)) : '';
  const over = f.over ? prefixRefs(f.over(variant)) : '';
  return { fx: f.fx ? f.fx() : null, under, over };
}
