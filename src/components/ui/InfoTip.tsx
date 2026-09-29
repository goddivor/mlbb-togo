'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/helpers';
import Portal from './Portal';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

/** Distance between the trigger and the panel, and from the viewport edges. */
const GAP = 8;
const MARGIN = 8;
/** Grace period before a hover-opened panel closes (WCAG 1.4.13). */
const HIDE_DELAY = 200;

/**
 * Small "i" affordance that holds an explanation instead of printing it on the
 * page: a long paragraph of chrome pushes the real content down and ends up
 * read by nobody.
 *
 * It opens on hover (pointer devices), on focus (keyboard) and on click or tap
 * (touch devices have no hover; a tap pins it until the next tap). It closes on
 * Escape, on a pointer-down outside the trigger and the panel, when the focus
 * moves outside that pair, and when the trigger scrolls out of view. A
 * hover-opened panel closes after a short grace delay and is itself hoverable,
 * so the text can be read, selected and copied (WCAG 1.4.13). The trigger is a
 * real `<button>` carrying an `aria-label`, and the panel is referenced with
 * `aria-describedby`, so a screen reader announces the text with the control it
 * explains.
 *
* The panel is rendered in a portal and positioned `fixed` against the
 * trigger, then clamped inside the viewport: it is therefore never clipped by
 * a scrolling ancestor (a modal body, a table wrapper, a card with
 * `overflow-hidden`) and never overflows the screen at 390 px.
 *
 * Props:
 * - `content` — the explanation. Required. Accepts rich nodes.
 * - `label` — accessible name of the trigger (default « Plus d’informations »).
 *   Pass a translated string.
 * - `title` — optional heading shown in bold at the top of the panel.
 * - `side` — `top | bottom | left | right`, the preferred position (default
 *   `bottom`). Flips to the opposite side when there is no room.
 * - `align` — `start | center | end` along the trigger, for the `top` and
 *   `bottom` sides (default `start`).
 * - `size` — icon size in pixels (default 14).
 * - `maxWidth` — panel width in pixels before clamping (default 320).
 * - `children` — custom trigger replacing the default icon button.
 * - `className` — class of the inline wrapper.
 */
export default function InfoTip({
  content,
  label = 'Plus d’informations',
  title,
  side = 'bottom',
  align = 'start',
  size = 14,
  maxWidth = 320,
  children,
  className,
}: {
  content: ReactNode;
  label?: string;
  title?: ReactNode;
  side?: Side;
  align?: Align;
  size?: number;
  maxWidth?: number;
  children?: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  // A tap both focuses and clicks: `pinned` keeps the panel open until the
  // next tap, Escape or a click outside.
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  // Read inside the delayed close, which would otherwise capture a stale value.
  const pinnedRef = useRef(false);
  pinnedRef.current = pinned;

  useEffect(() => () => clearTimeout(timer.current), []);

  /** True when the node belongs to the trigger or to the panel. */
  const owns = useCallback(
    (node: Node | null) => !!node && (!!wrap.current?.contains(node) || !!panel.current?.contains(node)),
    [],
  );

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
    setPinned(false);
  }, []);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(true);
  }, []);

  /**
   * Leaving the trigger or the panel closes it, but only after a short grace
   * delay: WCAG 1.4.13 requires the content to stay reachable, and the pointer
   * has to cross the gap between the two.
   */
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!pinnedRef.current) setOpen(false);
    }, HIDE_DELAY);
  }, []);

  const place = useCallback(() => {
    const trigger = wrap.current?.getBoundingClientRect();
    if (!trigger) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(maxWidth, vw - 2 * MARGIN);
    const height = panel.current?.offsetHeight ?? 0;

    let top: number;
    let left: number;
    if (side === 'left' || side === 'right') {
      top = trigger.top;
      left = side === 'left' ? trigger.left - width - GAP : trigger.right + GAP;
      if (left < MARGIN) left = trigger.right + GAP;
      if (left + width > vw - MARGIN) left = trigger.left - width - GAP;
    } else {
      const below = side === 'bottom';
      top = below ? trigger.bottom + GAP : trigger.top - height - GAP;
      // Flip when the preferred side has no room.
      if (below && height && top + height > vh - MARGIN) top = trigger.top - height - GAP;
      if (!below && top < MARGIN) top = trigger.bottom + GAP;
      left =
        align === 'end'
          ? trigger.right - width
          : align === 'center'
            ? trigger.left + trigger.width / 2 - width / 2
            : trigger.left;
    }
    left = Math.min(Math.max(MARGIN, left), vw - width - MARGIN);
    top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - height - MARGIN));
    setPos({ top, left, width });
  }, [align, maxWidth, side]);

  // Measured before paint so the panel never flashes at the wrong place. It
  // runs twice: once without a height, once the panel is in the DOM.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open, place, content]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointer = (e: Event) => {
      if (!owns(e.target as Node)) close();
    };
    // Focus leaving the trigger/panel pair closes a pinned panel: tabbing away
    // must not leave it hanging over the page.
    const onFocusIn = (e: FocusEvent) => {
      if (!owns(e.target as Node)) close();
    };
    const onMove = () => {
      // The trigger scrolled out of view: the panel has nothing to point at.
      const r = wrap.current?.getBoundingClientRect();
      if (r && (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth)) {
        close();
        return;
      }
      place();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place, close, owns]);

  return (
    <span
      ref={wrap}
      className={cn('relative inline-flex align-middle', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => {
          clearTimeout(timer.current);
          const next = !pinned;
          setPinned(next);
          setOpen(next);
        }}
        onFocus={show}
        onBlur={hide}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-ink-3 outline-none transition-colors duration-fast hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/40',
          children ? '' : 'h-5 w-5 border border-line-strong bg-surface-1 dark:bg-surface-0/60',
          open && !children ? 'border-primary/50 text-primary' : '',
        )}
      >
        {children ?? <Info size={size} aria-hidden="true" />}
      </button>

      {open && (
        <Portal>
          <div
            ref={panel}
            role="tooltip"
            id={id}
            onMouseEnter={show}
            onMouseLeave={hide}
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: pos?.width ?? maxWidth,
            }}
            className="fixed z-[100010] rounded border border-line-strong bg-surface-1 p-3 text-xs font-normal leading-relaxed text-ink-2 shadow-elev-2 dark:bg-surface-2"
          >
            {title && <span className="mb-1 block font-semibold text-ink-1">{title}</span>}
            {content}
          </div>
        </Portal>
      )}
    </span>
  );
}
