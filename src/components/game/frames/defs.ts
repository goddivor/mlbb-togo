/**
 * Shared SVG definitions (gradients, pattern, filters) used by every frame.
 * Ported verbatim from tools/rewards-proposal/frames-preview.html; ids are
 * prefixed with `mlf-` to avoid clashing with other SVGs of the app.
 * Rendered once per document by <FrameDefs />.
 */
export const FRAME_DEFS_MARKUP =
  `<linearGradient id="mlf-g-bronze" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffd6a8"/>
  <stop offset=".3" stop-color="#cf8246"/>
  <stop offset=".58" stop-color="#6b3413"/>
  <stop offset=".82" stop-color="#e59b5f"/>
  <stop offset="1" stop-color="#7d4019"/>
  </linearGradient>
  <linearGradient id="mlf-g-silver" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".3" stop-color="#c8d0dc"/>
  <stop offset=".55" stop-color="#6f7b8f"/>
  <stop offset=".8" stop-color="#eef2f7"/>
  <stop offset="1" stop-color="#8b96a8"/>
  </linearGradient>
  <linearGradient id="mlf-g-gold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff4c2"/>
  <stop offset=".28" stop-color="#f6c453"/>
  <stop offset=".55" stop-color="#9a5b12"/>
  <stop offset=".8" stop-color="#ffdc7a"/>
  <stop offset="1" stop-color="#b87a1c"/>
  </linearGradient>
  <linearGradient id="mlf-g-plat" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f6fcff"/>
  <stop offset=".3" stop-color="#b3d3e2"/>
  <stop offset=".58" stop-color="#4f6f84"/>
  <stop offset=".82" stop-color="#e2f6ff"/>
  <stop offset="1" stop-color="#7c9bb0"/>
  </linearGradient>
  <linearGradient id="mlf-g-diamond" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#eafdff"/>
  <stop offset=".35" stop-color="#5ee6ff"/>
  <stop offset=".62" stop-color="#1f6fd0"/>
  <stop offset=".85" stop-color="#b9f5ff"/>
  <stop offset="1" stop-color="#2a8bdc"/>
  </linearGradient>
  <linearGradient id="mlf-g-ice" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".4" stop-color="#bfefff"/>
  <stop offset=".7" stop-color="#5aa9e6"/>
  <stop offset="1" stop-color="#e6f9ff"/>
  </linearGradient>
  <linearGradient id="mlf-g-violet" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f1e4ff"/>
  <stop offset=".3" stop-color="#b57bff"/>
  <stop offset=".6" stop-color="#4c1d95"/>
  <stop offset=".85" stop-color="#d0a6ff"/>
  <stop offset="1" stop-color="#6d28d9"/>
  </linearGradient>
  <linearGradient id="mlf-g-storm" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#8b5cf6"/>
  <stop offset=".5" stop-color="#1e1147"/>
  <stop offset="1" stop-color="#6d28d9"/>
  </linearGradient>
  <linearGradient id="mlf-g-mythic" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ff4655"/>
  <stop offset=".5" stop-color="#a855f7"/>
  <stop offset="1" stop-color="#00d4ff"/>
  </linearGradient>
  <linearGradient id="mlf-g-mvp" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff1b8"/>
  <stop offset=".4" stop-color="#f2b544"/>
  <stop offset=".75" stop-color="#8b3fe0"/>
  <stop offset="1" stop-color="#e9d5ff"/>
  </linearGradient>
  <linearGradient id="mlf-g-ember" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffd27a"/>
  <stop offset=".45" stop-color="#e2531f"/>
  <stop offset=".75" stop-color="#6e0f1c"/>
  <stop offset="1" stop-color="#ff8a3d"/>
  </linearGradient>
  <linearGradient id="mlf-g-steel" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#e8f3ff"/>
  <stop offset=".35" stop-color="#7f9cc4"/>
  <stop offset=".6" stop-color="#1f3358"/>
  <stop offset=".85" stop-color="#c7dcff"/>
  <stop offset="1" stop-color="#3a5a8c"/>
  </linearGradient>
  <linearGradient id="mlf-g-jungle" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#d9ff9e"/>
  <stop offset=".4" stop-color="#22c55e"/>
  <stop offset=".75" stop-color="#0b4a2a"/>
  <stop offset="1" stop-color="#6ee7a0"/>
  </linearGradient>
  <linearGradient id="mlf-g-roam" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#d6ecff"/>
  <stop offset=".4" stop-color="#3b82f6"/>
  <stop offset=".75" stop-color="#172a6b"/>
  <stop offset="1" stop-color="#93c5fd"/>
  </linearGradient>
  <linearGradient id="mlf-g-exp" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffe0bd"/>
  <stop offset=".4" stop-color="#f97316"/>
  <stop offset=".75" stop-color="#6b1f0c"/>
  <stop offset="1" stop-color="#fdba74"/>
  </linearGradient>
  <linearGradient id="mlf-g-teal" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ccfbf1"/>
  <stop offset=".35" stop-color="#14b8a6"/>
  <stop offset=".62" stop-color="#0b3b3a"/>
  <stop offset=".85" stop-color="#f2d27a"/>
  <stop offset="1" stop-color="#0f766e"/>
  </linearGradient>
  <linearGradient id="mlf-g-ochre" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffe7b3"/>
  <stop offset=".4" stop-color="#d69a4a"/>
  <stop offset=".7" stop-color="#6b4217"/>
  <stop offset="1" stop-color="#f3c77e"/>
  </linearGradient>
  <linearGradient id="mlf-g-party" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#7df3ff"/>
  <stop offset=".5" stop-color="#6d5dfc"/>
  <stop offset="1" stop-color="#e879f9"/>
  </linearGradient>
  <linearGradient id="mlf-g-togo" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#00804f"/>
  <stop offset=".2" stop-color="#00804f"/>
  <stop offset=".2" stop-color="#ffce00"/>
  <stop offset=".4" stop-color="#ffce00"/>
  <stop offset=".4" stop-color="#00804f"/>
  <stop offset=".6" stop-color="#00804f"/>
  <stop offset=".6" stop-color="#ffce00"/>
  <stop offset=".8" stop-color="#ffce00"/>
  <stop offset=".8" stop-color="#00804f"/>
  <stop offset="1" stop-color="#00804f"/>
  </linearGradient>
  <linearGradient id="mlf-g-ruby" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffc2c8"/>
  <stop offset=".45" stop-color="#ff2d4a"/>
  <stop offset="1" stop-color="#6b0717"/>
  </linearGradient>
  <linearGradient id="mlf-g-sapph" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#e0fbff"/>
  <stop offset=".45" stop-color="#00c2f0"/>
  <stop offset="1" stop-color="#0b3c7a"/>
  </linearGradient>
  <linearGradient id="mlf-g-amethyst" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f3e8ff"/>
  <stop offset=".45" stop-color="#a855f7"/>
  <stop offset="1" stop-color="#3b0a70"/>
  </linearGradient>
  <linearGradient id="mlf-g-emerald" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#dcfce7"/>
  <stop offset=".45" stop-color="#22c55e"/>
  <stop offset="1" stop-color="#064e2b"/>
  </linearGradient>
  <pattern id="mlf-p-kente" width="12" height="12" patternUnits="userSpaceOnUse">
  <rect width="12" height="12" fill="#0b6b3a"/>
  <rect width="6" height="6" fill="#ffce00"/>
  <rect x="6" y="6" width="6" height="6" fill="#d21034"/>
  <path d="M0 3H6M9 6V12" stroke="#111" stroke-width="1.2"/>
  <path d="M6 0V6M6 9H12" stroke="#ffce00" stroke-width=".8"/>
  </pattern>
  <radialGradient id="mlf-g-flame" cx=".5" cy=".6" r=".65">
  <stop offset="0" stop-color="#fff8d6"/>
  <stop offset=".3" stop-color="#ffc53d"/>
  <stop offset=".65" stop-color="#ff5b24"/>
  <stop offset="1" stop-color="#a3102a"/>
  </radialGradient>
  <radialGradient id="mlf-g-bflame" cx=".5" cy=".6" r=".65">
  <stop offset="0" stop-color="#f2ffff"/>
  <stop offset=".3" stop-color="#8af0ff"/>
  <stop offset=".65" stop-color="#2b7bff"/>
  <stop offset="1" stop-color="#23198a"/>
  </radialGradient>
  <radialGradient id="mlf-g-sun" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#fff1c9" stop-opacity=".95"/>
  <stop offset=".5" stop-color="#f3b561" stop-opacity=".55"/>
  <stop offset="1" stop-color="#d98a3a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="mlf-g-halo" cx=".5" cy=".5" r=".5">
  <stop offset=".72" stop-color="#7dd3fc" stop-opacity="0"/>
  <stop offset=".86" stop-color="#7dd3fc" stop-opacity=".45"/>
  <stop offset="1" stop-color="#7dd3fc" stop-opacity="0"/>
  </radialGradient>
  <filter id="mlf-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="1.8" result="b"/>
  <feMerge>
  <feMergeNode in="b"/>
  <feMergeNode in="SourceGraphic"/>
  </feMerge>
  </filter>
  <filter id="mlf-glow2" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="3.2" result="b"/>
  <feMerge>
  <feMergeNode in="b"/>
  <feMergeNode in="b"/>
  <feMergeNode in="SourceGraphic"/>
  </feMerge>
  </filter>
  <filter id="mlf-drop" x="-30%" y="-30%" width="160%" height="160%">
  <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#000" flood-opacity=".6"/>
  </filter>`;
