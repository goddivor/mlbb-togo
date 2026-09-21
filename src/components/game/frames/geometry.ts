/**
 * Geometry helpers for the avatar frames, ported from
 * tools/rewards-proposal/frames-preview.html (validated reference).
 *
 * Every frame is drawn in a 128x128 view box centred on (64, 64). Helpers
 * return SVG markup strings: all their inputs are internal constants of the
 * catalogue (no user data ever reaches them), which is why string generation
 * is safe here. Keeping the reference's string form guarantees pixel fidelity
 * with the 64 validated renderers.
 *
 * Paint references use bare ids (`url(#g-gold)`); `renderLayer()` prefixes
 * them with `mlf-` to match <FrameDefs />.
 */

export type Pt = [number, number];

/** Frame effect layer (rotating conic halo) rendered as HTML, not SVG. */
export interface FxSpec {
  square: boolean;
  /** Comma separated conic-gradient colour stops. */
  colors: string;
  /** Rotation period in seconds. */
  duration: number;
}

export const R = Math.PI / 180;
export const n2 = (v: number): number => Math.round(v * 100) / 100;
/** Polar to cartesian: radius `r`, angle `d` in degrees clockwise from 12 o'clock. */
export const P = (r: number, d: number): Pt => [64 + r * Math.sin(d * R), 64 - r * Math.cos(d * R)];
export const pt = (r: number, d: number): string => P(r, d).map(n2).join(' ');
export const rep = (n: number, fn: (d: number, i: number) => string, off = 0): string =>
  Array.from({ length: n }, (_, i) => fn(off + (i * 360) / n, i)).join('');
export const circ = (r: number, s: string, w: number, x = ''): string =>
  `<circle cx="64" cy="64" r="${r}" fill="none" stroke="${s}" stroke-width="${w}" ${x}/>`;
export const bevel = (r: number, w: number, g: string): string =>
  circ(r, '#04060c', w + 2.6, 'opacity=".75"') +
  circ(r, `url(#${g})`, w) +
  circ(n2(r - w / 2 + 0.7), 'rgba(255,255,255,.6)', 0.9) +
  circ(n2(r + w / 2 - 0.6), 'rgba(0,0,0,.5)', 0.9);
export const glint = (r: number, w: number, d = 4.5, len = 16): string =>
  `<g class="spin" style="--d:${d}s">${circ(r, '#fff', w, `stroke-dasharray="${len} 400" stroke-linecap="round" opacity=".75" filter="url(#glow)"`)}</g>`;
export const poly = (n: number, r: number, rot = 0): string =>
  Array.from({ length: n }, (_, i) => pt(r, rot + (i * 360) / n)).join(' ');
export const polyRing = (n: number, r: number, w: number, g: string, rot = 0): string =>
  `<polygon points="${poly(n, r, rot)}" fill="none" stroke="#04060c" stroke-width="${w + 2.6}" stroke-linejoin="round" opacity=".75"/><polygon points="${poly(n, r, rot)}" fill="none" stroke="url(#${g})" stroke-width="${w}" stroke-linejoin="round"/>`;
export const spike = (d: number, a: number, b: number, h: number, f: string, x = ''): string =>
  `<polygon points="${pt(a, d - h)} ${pt(b, d)} ${pt(a, d + h)}" fill="${f}" stroke="#04060c" stroke-width=".8" stroke-linejoin="round" ${x}/>`;
export const shard = (d: number, a: number, b: number, h: number, f: string): string => {
  const m = (a + b) / 2;
  return `<polygon points="${pt(a, d)} ${pt(m, d - h)} ${pt(b, d)} ${pt(m, d + h)}" fill="${f}" stroke="#04060c" stroke-width=".7"/><polyline points="${pt(a, d)} ${pt(b, d)}" stroke="rgba(255,255,255,.55)" stroke-width=".6"/>`;
};
export const blade = (d: number, a: number, b: number, h: number, f: string): string =>
  `<polygon points="${pt(a, d - h)} ${pt(b - 7, d - h * 0.55)} ${pt(b, d)} ${pt(b - 7, d + h * 0.55)} ${pt(a, d + h)}" fill="${f}" stroke="#04060c" stroke-width=".9" stroke-linejoin="round"/><polyline points="${pt(a, d)} ${pt(b - 1, d)}" stroke="rgba(255,255,255,.7)" stroke-width=".8"/>`;

export function leaf(A: Pt, B: Pt, w: number, f: string, x = ''): string {
  const [x1, y1] = A;
  const [x2, y2] = B;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / L) * w;
  const ny = ((x2 - x1) / L) * w;
  return `<path d="M${n2(x1)} ${n2(y1)}Q${n2(mx + nx)} ${n2(my + ny)} ${n2(x2)} ${n2(y2)}Q${n2(mx - nx)} ${n2(my - ny)} ${n2(x1)} ${n2(y1)}Z" fill="${f}" ${x}/>`;
}

export function flame(d: number, r0: number, len: number, w: number, lean: number, f: string): string {
  const BL = pt(r0, d - w);
  const BR = pt(r0, d + w);
  const T = pt(r0 + len, d + lean);
  const CL = pt(r0 + len * 0.55, d - w * 1.15 + lean * 0.3);
  const CR = pt(r0 + len * 0.5, d + w * 1.15 + lean * 0.55);
  return `<path d="M${BL}Q${CL} ${T}Q${CR} ${BR}Z" fill="${f}"/>`;
}

export const star4 = (x: number, y: number, s: number, f: string, c = 'tw', dl = 0): string =>
  `<path class="${c}" style="animation-delay:${dl}s" d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${f}"/>`;

export function star5(x: number, y: number, Ro: number, Ri: number, f: string, x2 = ''): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? Ri : Ro;
    const a = i * 36 * R;
    p.push(n2(x + r * Math.sin(a)) + ' ' + n2(y - r * Math.cos(a)));
  }
  return `<polygon points="${p.join(' ')}" fill="${f}" stroke="#04060c" stroke-width=".8" stroke-linejoin="round" ${x2}/>`;
}

export const gem = (x: number, y: number, s: number, g: string, rot = 0): string =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 ${-s}L${s * 0.72} 0L0 ${s}L${-s * 0.72} 0Z" fill="url(#${g})" stroke="#04060c" stroke-width=".9" stroke-linejoin="round"/><path d="M0 ${-s}V${s}M${-s * 0.72} 0H${s * 0.72}" stroke="rgba(255,255,255,.45)" stroke-width=".6"/><path d="M${-s * 0.2} ${-s * 0.45}L0 ${-s * 0.8}" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></g>`;
export const orb = (x: number, y: number, r: number, g: string, x2 = ''): string =>
  `<g ${x2}><circle cx="${n2(x)}" cy="${n2(y)}" r="${r}" fill="url(#${g})" stroke="#04060c" stroke-width=".8"/><circle cx="${n2(x - r * 0.35)}" cy="${n2(y - r * 0.35)}" r="${n2(r * 0.32)}" fill="#fff" opacity=".8"/></g>`;
export const rivets = (n: number, r: number, f: string, s: number, off = 0): string =>
  rep(
    n,
    (d) => {
      const [x, y] = P(r, d);
      return `<circle cx="${n2(x)}" cy="${n2(y)}" r="${s}" fill="${f}" stroke="#2a1405" stroke-width=".6"/>`;
    },
    off,
  );

export function crown(cx: number, top: number, w: number, h: number, g: string, gemG: string | null): string {
  const b = top + h;
  const p = (
    [
      [cx - w / 2, b],
      [cx - w / 2, top + h * 0.28],
      [cx - w / 4, top + h * 0.58],
      [cx, top],
      [cx + w / 4, top + h * 0.58],
      [cx + w / 2, top + h * 0.28],
      [cx + w / 2, b],
    ] as Pt[]
  )
    .map((q) => q.map(n2).join(' '))
    .join(' ');
  const tips = (
    [
      [cx - w / 2, top + h * 0.28],
      [cx, top],
      [cx + w / 2, top + h * 0.28],
    ] as Pt[]
  )
    .map(
      ([x, y]) =>
        `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(Math.max(1.6, w * 0.05))}" fill="#fff3c4" stroke="#04060c" stroke-width=".6"/>`,
    )
    .join('');
  return `<g filter="url(#drop)"><polygon points="${p}" fill="url(#${g})" stroke="#04060c" stroke-width="1" stroke-linejoin="round"/><rect x="${cx - w / 2}" y="${b - h * 0.24}" width="${w}" height="${h * 0.24}" fill="url(#${g})" stroke="#04060c" stroke-width=".8"/>${tips}${gemG ? gem(cx, top + h * 0.66, h * 0.26, gemG) : ''}</g>`;
}

export function wingR(g: string, n = 5, A: Pt = [100, 62], L0 = 44, L1 = 26, a0 = -70, a1 = 30, w = 7): string {
  let s = '';
  for (let i = n - 1; i >= 0; i--) {
    const t = n > 1 ? i / (n - 1) : 0;
    const a = (a0 + (a1 - a0) * t) * R;
    const L = L0 - (L0 - L1) * t;
    s +=
      leaf(A, [A[0] + L * Math.cos(a), A[1] + L * Math.sin(a)], w, `url(#${g})`, 'stroke="#04060c" stroke-width=".8"') +
      leaf(A, [A[0] + L * 0.8 * Math.cos(a), A[1] + L * 0.8 * Math.sin(a)], 0.4, 'rgba(255,255,255,.55)');
  }
  return s;
}

export interface WingOpts {
  n?: number;
  A?: Pt;
  L0?: number;
  L1?: number;
  a0?: number;
  a1?: number;
  w?: number;
}

export const wings = (g: string, o: WingOpts = {}, anim = true): string => {
  const r = wingR(g, o.n, o.A, o.L0, o.L1, o.a0, o.a1, o.w);
  return `<g class="${anim ? 'flapL' : ''}"><g transform="translate(128 0) scale(-1 1)">${r}</g></g><g class="${anim ? 'flapR' : ''}">${r}</g>`;
};

export function laurel(side: number, g: string, r = 54): string {
  let s = '';
  const ds = [200, 214, 228, 242, 256, 270, 284, 298, 312, 326];
  ds.forEach((d0) => {
    const d = side < 0 ? d0 : 360 - d0;
    const lean = side < 0 ? 9 : -9;
    const B = P(r, d);
    s +=
      leaf(B, P(r + 9, d + lean), 2.8, `url(#${g})`, 'stroke="#04060c" stroke-width=".6"') +
      leaf(B, P(r - 6, d + lean * 1.2), 2.4, `url(#${g})`, 'stroke="#04060c" stroke-width=".6"');
  });
  const a = P(r, side < 0 ? 196 : 164);
  const b = P(r, side < 0 ? 330 : 30);
  s =
    `<path d="M${a.map(n2).join(' ')}A${r} ${r} 0 0 ${side < 0 ? 1 : 0} ${b.map(n2).join(' ')}" fill="none" stroke="url(#${g})" stroke-width="1.6"/>` +
    s;
  return s;
}

export const plate = (txt: string, g: string, col = '#fff3c4', w = 30): string =>
  `<g filter="url(#drop)"><path d="M${64 - w / 2} 108h${w}l4 6-4 6h-${w}l-4-6z" fill="#0b0f1c" stroke="url(#${g})" stroke-width="1.8"/><text x="64" y="117.6" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="8.5" letter-spacing=".6" fill="${col}">${txt}</text></g>`;

export const RUNES = [
  'M-2 -4V4M-2 -1L2 -4M-2 2L2 -1',
  'M-2 4V-4L2 0L-2 4',
  'M0 -4V4M-3 -2L3 2',
  'M-2 -4V4M2 -4V4M-2 0L2 0',
  'M-3 4L0 -4L3 4M-2 1H2',
  'M0 -4V4M0 -4L3 -1M0 0L-3 3',
  'M-2 -4L2 4M2 -4L-2 4',
  'M-3 -3H3M0 -3V4M-2 4H2',
];
export const runes = (n: number, r: number, col: string, sc = 1): string =>
  rep(n, (d, i) => {
    const [x, y] = P(r, d);
    return `<path d="${RUNES[i % RUNES.length]}" transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(d)}) scale(${sc})" fill="none" stroke="${col}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
export const dots = (n: number, rA: number, rB: number, cols: string[], sz: number[]): string =>
  Array.from({ length: n }, (_, i) => {
    const d = (i * 137.5) % 360;
    const r = rA + (((i * 7) % 10) / 10) * (rB - rA);
    const [x, y] = P(r, d);
    return `<circle cx="${n2(x)}" cy="${n2(y)}" r="${sz[i % sz.length]}" fill="${cols[i % cols.length]}"/>`;
  }).join('');
export const arc = (r: number, d1: number, d2: number, s: string, w: number, x = ''): string => {
  const a = P(r, d1);
  const b = P(r, d2);
  return `<path d="M${a.map(n2).join(' ')}A${r} ${r} 0 ${d2 - d1 > 180 ? 1 : 0} 1 ${b.map(n2).join(' ')}" fill="none" stroke="${s}" stroke-width="${w}" ${x}/>`;
};
/** Circular rotating conic halo (HTML layer). */
export const fx = (c: string, d = 6): FxSpec => ({ square: false, colors: c, duration: d });

/* ---------- Square helpers (same 128 view box, border centred on inset i) ---------- */

export const box = (i: number, rx: number): string =>
  `x="${n2(i)}" y="${n2(i)}" width="${n2(128 - 2 * i)}" height="${n2(128 - 2 * i)}" rx="${n2(Math.max(0, rx))}"`;
export const rr = (i: number, rx: number, s: string, w: number, x = ''): string =>
  `<rect ${box(i, rx)} fill="none" stroke="${s}" stroke-width="${w}" ${x}/>`;
export const sqBevel = (i: number, w: number, g: string, rx = 10): string =>
  rr(i, rx, '#04060c', w + 2.6, 'opacity=".75"') +
  rr(i, rx, `url(#${g})`, w) +
  rr(i + w / 2 - 0.7, rx - w / 2 + 0.7, 'rgba(255,255,255,.55)', 0.9) +
  rr(i - w / 2 + 0.6, rx + w / 2 - 0.6, 'rgba(0,0,0,.5)', 0.9);

export function rrPath(i: number, rx: number): string {
  const a = n2(i);
  const b = n2(128 - i);
  const r = n2(rx);
  const p = n2(i + rx);
  const q = n2(128 - i - rx);
  return `M${p} ${a}H${q}A${r} ${r} 0 0 1 ${b} ${p}V${q}A${r} ${r} 0 0 1 ${q} ${b}H${p}A${r} ${r} 0 0 1 ${a} ${q}V${p}A${r} ${r} 0 0 1 ${p} ${a}Z`;
}

/*
 * Local ids (clip paths of the square glint) must be unique per frame
 * instance and identical between the server and the client render. The
 * renderer sets a per-instance prefix (from React `useId`) and resets the
 * counter before each synchronous render; see `renderLayer()`.
 */
let idPrefix = 'mlf';
let idCounter = 0;
export function resetLocalIds(prefix: string): void {
  idPrefix = prefix;
  idCounter = 0;
}
const nextLocalId = (): string => `${idPrefix}-c${++idCounter}`;

export const sqGlint = (i: number, w: number, rx = 10, d = 4.5): string => {
  const id = nextLocalId();
  return `<clipPath id="mlf-${id}"><path clip-rule="evenodd" d="${rrPath(i - w / 2, rx + w / 2)}${rrPath(i + w / 2, Math.max(0.5, rx - w / 2))}"/></clipPath><g clip-path="url(#${id})"><g transform="rotate(30 64 64)"><rect class="sweep" style="--d:${d}s" x="-34" y="-50" width="12" height="230" fill="#fff" opacity=".75"/></g></g>`;
};
export const corners = (s: string): string =>
  `<g>${s}</g><g transform="matrix(-1 0 0 1 128 0)">${s}</g><g transform="matrix(1 0 0 -1 0 128)">${s}</g><g transform="matrix(-1 0 0 -1 128 128)">${s}</g>`;
export const mir = (s: string): string => `<g>${s}</g><g transform="matrix(-1 0 0 1 128 0)">${s}</g>`;
export const edges = (fn: string | ((k: number) => string)): string =>
  [0, 90, 180, 270]
    .map((r, k) => `<g transform="rotate(${r} 64 64)">${typeof fn === 'function' ? fn(k) : fn}</g>`)
    .join('');
/** Square rotating conic halo (HTML layer). */
export const fxSq = (c: string, d = 6): FxSpec => ({ square: true, colors: c, duration: d });

export function kite(B: Pt, T: Pt, w: number, f: string): string {
  const [x1, y1] = B;
  const [x2, y2] = T;
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / L) * w;
  const ny = ((x2 - x1) / L) * w;
  const mx = x1 + (x2 - x1) * 0.35;
  const my = y1 + (y2 - y1) * 0.35;
  return `<polygon points="${n2(x1)},${n2(y1)} ${n2(mx + nx)},${n2(my + ny)} ${n2(x2)},${n2(y2)} ${n2(mx - nx)},${n2(my - ny)}" fill="${f}" stroke="#04060c" stroke-width=".8" stroke-linejoin="round"/><polyline points="${n2(x1)},${n2(y1)} ${n2(x2)},${n2(y2)}" stroke="rgba(255,255,255,.6)" stroke-width=".6"/>`;
}

export const hud = (col: string, w = 3.2): string => {
  const d = 'M5 27V9Q5 5 9 5H27';
  return corners(
    `<path d="${d}" fill="none" stroke="#04060c" stroke-width="${w + 2}" opacity=".7"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}"/>`,
  );
};
export const cup = (x: number, y: number, s = 1): string =>
  `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#drop)"><path d="M-8 4H-12Q-12 9-7 10M8 4H12Q12 9 7 10" fill="none" stroke="#04060c" stroke-width="2.6"/><path d="M-8 4H-12Q-12 9-7 10M8 4H12Q12 9 7 10" fill="none" stroke="url(#g-gold)" stroke-width="1.4"/><path d="M-8 2H8V6Q8 13 0 14Q-8 13-8 6Z" fill="url(#g-gold)" stroke="#04060c" stroke-width=".9"/><rect x="-3" y="14" width="6" height="4" fill="url(#g-gold)" stroke="#04060c" stroke-width=".7"/><path d="M-4 5V9" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".7"/></g>`;
