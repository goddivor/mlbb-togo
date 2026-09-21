import { FRAME_DEFS_MARKUP } from './defs';

/**
 * Shared gradients, pattern and filters of the avatar frames. Mounted once in
 * the root layout so every <FrameArt /> of the page can reference them
 * (`url(#mlf-g-gold)`...). The ids are static, so server and client markup
 * are identical. Hidden with a zero-size box, not `display:none`, which
 * would disable the gradients in some browsers.
 */
export default function FrameDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs dangerouslySetInnerHTML={{ __html: FRAME_DEFS_MARKUP }} />
    </svg>
  );
}
