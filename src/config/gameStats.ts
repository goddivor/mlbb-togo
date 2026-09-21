/**
 * Detailed game stats (career, seasons, frequent heroes, match history, match
 * detail) came from MLBB Academy's `battlereport/*` routes. Moonton shut
 * Academy down for good on 30/06/2026 and offers no replacement web API: only
 * the base profile (avatar, nickname, level, rank, peak rank, country) is
 * still served. While false, the stats UI only renders blocks that already
 * hold cached data and never shows empty or "unavailable" placeholders.
 * Flip to true if a new source of detailed stats appears.
 */
export const GAME_STATS_ENABLED = false;
