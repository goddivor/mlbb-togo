/**
 * Avatar frames library (issue #123). Public API:
 * - `FRAMES`, `FRAME_IDS`, `LEVEL_FRAMES`, `FRAME_TIERS`, `FRAME_TIER_COLORS`
 * - `getFrame(id)`, `parseFrameRef('id:variant')`, `formatFrameRef(id, variant)`,
 *   `resolveFrame(ref)`, `seasonOfVariant('S2')`, `framesByTier(list?)`
 * - `<FrameArt frame variant size label>` draws a frame around its children
 * - `<FrameDefs />` shared SVG definitions, mounted once in the root layout
 * Most screens should use `AvatarFrame` from `@/components/game` instead.
 */
export {
  FRAMES,
  FRAME_IDS,
  LEVEL_FRAMES,
  FRAME_TIERS,
  FRAME_TIER_COLORS,
  getFrame,
  parseFrameRef,
  formatFrameRef,
  resolveFrame,
  seasonOfVariant,
  framesByTier,
} from './catalog';
export type { FrameInfo, FrameTier, FrameShape, FrameAnimation, FrameCategory, FrameRef } from './catalog';
export { renderFrameLayers } from './render';
export type { FrameLayers } from './render';
export { default as FrameArt } from './FrameArt';
export { default as FrameDefs } from './FrameDefs';
