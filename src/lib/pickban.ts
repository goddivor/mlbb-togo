// Client mirror of the backend draft-order state machine
// (backend: src/pickban/pickban-order.ts). Used for the local (unsaved) board
// and to know which team/action the current step expects.

export type PickBanMode = 'ranked' | 'tournament';
export type PickBanAction = 'pick' | 'ban';
export type PickBanTeam = 'blue' | 'red';

export interface DraftStep {
  step: number;
  action: PickBanAction;
  team: PickBanTeam;
}

export interface TeamPick {
  heroId: string;
  heroName: string;
  lane?: string;
}

export interface TeamBan {
  heroId: string;
  heroName: string;
}

export interface TeamState {
  picks: TeamPick[];
  bans: TeamBan[];
}

export interface DraftState {
  mode: PickBanMode;
  currentStep: number;
  blueTeam: TeamState;
  redTeam: TeamState;
}

export interface PickBanHero {
  id: string;
  heroId: number | null;
  name: string;
  image?: string | null;
  thumb?: string | null;
  role?: string | null;
  roles?: string[];
  laneKeys?: string[];
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
}

export interface SuggestionReason {
  kind:
    | 'counters'
    | 'counteredBy'
    | 'synergy'
    | 'lane'
    | 'threatens'
    | 'pairsWith'
    | 'winRate'
    | 'banRate';
  names?: string[];
  lane?: string;
  value?: number;
}

export interface HeroSuggestion {
  heroId: string;
  heroName: string;
  image?: string;
  thumb?: string;
  role?: string;
  reason: string; // English summary from the API
  reasons: SuggestionReason[];
  score: number;
}

export interface SuggestResponse {
  suggestions: HeroSuggestion[];
  action: PickBanAction;
  team: PickBanTeam;
  metaAvailable: boolean;
}

export const LANES = ['gold', 'mid', 'jungle', 'exp', 'roam'] as const;
export const PICKS_PER_TEAM = 5;
export const BANS_PER_TEAM: Record<PickBanMode, number> = { ranked: 3, tournament: 5 };

const PICK_PATTERN: PickBanTeam[] = [
  'blue', 'red', 'red', 'blue', 'blue', 'red', 'red', 'blue', 'blue', 'red',
];

function buildOrder(mode: PickBanMode): DraftStep[] {
  const order: DraftStep[] = [];
  for (let i = 0; i < BANS_PER_TEAM[mode] * 2; i++) {
    order.push({ step: order.length, action: 'ban', team: i % 2 === 0 ? 'blue' : 'red' });
  }
  for (const team of PICK_PATTERN) order.push({ step: order.length, action: 'pick', team });
  return order;
}

export const DRAFT_ORDERS: Record<PickBanMode, DraftStep[]> = {
  ranked: buildOrder('ranked'),
  tournament: buildOrder('tournament'),
};

export const totalSteps = (mode: PickBanMode) => DRAFT_ORDERS[mode].length;
export const stepAt = (mode: PickBanMode, step: number): DraftStep | null =>
  DRAFT_ORDERS[mode][step] ?? null;
export const emptyTeam = (): TeamState => ({ picks: [], bans: [] });
export const emptyDraft = (mode: PickBanMode): DraftState => ({
  mode,
  currentStep: 0,
  blueTeam: emptyTeam(),
  redTeam: emptyTeam(),
});
export const isComplete = (s: DraftState) => s.currentStep >= totalSteps(s.mode);

export function usedHeroIds(s: Pick<DraftState, 'blueTeam' | 'redTeam'>): Set<string> {
  return new Set([
    ...s.blueTeam.picks.map((p) => p.heroId),
    ...s.blueTeam.bans.map((b) => b.heroId),
    ...s.redTeam.picks.map((p) => p.heroId),
    ...s.redTeam.bans.map((b) => b.heroId),
  ]);
}

export interface ApplyInput {
  heroId: string;
  heroName: string;
  lane?: string;
}

// Applies the current step with the given hero. Returns null if not allowed.
export function applyAction(s: DraftState, input: ApplyInput): DraftState | null {
  const step = stepAt(s.mode, s.currentStep);
  if (!step || usedHeroIds(s).has(input.heroId)) return null;
  const key = step.team === 'blue' ? 'blueTeam' : 'redTeam';
  const team: TeamState = { picks: [...s[key].picks], bans: [...s[key].bans] };
  if (step.action === 'pick') {
    team.picks.push({ heroId: input.heroId, heroName: input.heroName, lane: input.lane });
  } else {
    team.bans.push({ heroId: input.heroId, heroName: input.heroName });
  }
  return { ...s, [key]: team, currentStep: s.currentStep + 1 };
}

export function undoAction(s: DraftState): DraftState {
  if (s.currentStep === 0) return s;
  const last = stepAt(s.mode, s.currentStep - 1);
  if (!last) return s;
  const key = last.team === 'blue' ? 'blueTeam' : 'redTeam';
  const team: TeamState = { picks: [...s[key].picks], bans: [...s[key].bans] };
  if (last.action === 'pick') team.picks.pop();
  else team.bans.pop();
  return { ...s, [key]: team, currentStep: s.currentStep - 1 };
}

// Ordered list of the moves played so far (used to replay a local draft on save).
export function playedMoves(s: DraftState): Array<DraftStep & ApplyInput> {
  const idx = { blue: { pick: 0, ban: 0 }, red: { pick: 0, ban: 0 } };
  const moves: Array<DraftStep & ApplyInput> = [];
  for (let i = 0; i < s.currentStep; i++) {
    const step = stepAt(s.mode, i);
    if (!step) break;
    const team = step.team === 'blue' ? s.blueTeam : s.redTeam;
    const entry =
      step.action === 'pick'
        ? team.picks[idx[step.team].pick++]
        : team.bans[idx[step.team].ban++];
    if (!entry) break;
    moves.push({ ...step, heroId: entry.heroId, heroName: entry.heroName, lane: (entry as TeamPick).lane });
  }
  return moves;
}
