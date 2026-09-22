// Reward events (RewardEvent, catalogue §6.5): shapes and condition types.

export type EventStatus = 'draft' | 'scheduled' | 'active' | 'closed';
export type ConditionMode = 'all' | 'any';

export interface EventCondition {
  type: string;
  count: number;
  scope: string | null;
}

export interface EventRewards {
  achievementId: string | null;
  frameId: string | null;
  frameDays: number | null;
  xp: number;
}

export interface AdminRewardEvent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  recurrence: 'none' | 'yearly';
  status: EventStatus;
  /** Window already started and not closed: only widening edits are accepted. */
  open: boolean;
  conditionMode: ConditionMode;
  conditions: EventCondition[];
  rewards: EventRewards;
  awarded: number;
  createdAt: string;
  updatedAt: string;
}

export type ScopeKind = 'none' | 'tournament' | 'event';

export interface ConditionTypeDef {
  type: string;
  scope: ScopeKind;
  scopeRequired?: boolean;
  /** No count: a yes / no condition. */
  single?: boolean;
}

export const CONDITION_TYPES: ConditionTypeDef[] = [
  { type: 'daily_login', scope: 'none' },
  { type: 'forum_post', scope: 'none' },
  { type: 'comment_posted', scope: 'none' },
  { type: 'match_played', scope: 'none' },
  { type: 'match_win', scope: 'none' },
  { type: 'bracket_played', scope: 'tournament', scopeRequired: true },
  { type: 'bracket_win', scope: 'tournament' },
  { type: 'tournament_registration', scope: 'tournament' },
  { type: 'event_joined', scope: 'event' },
  { type: 'stream_watch', scope: 'none' },
  { type: 'pickban_completed', scope: 'none' },
  { type: 'account_created_before', scope: 'none', single: true },
];

export function conditionDef(type: string): ConditionTypeDef {
  return CONDITION_TYPES.find((c) => c.type === type) ?? { type, scope: 'none' };
}

export const STATUS_VARIANT: Record<EventStatus, string> = {
  draft: 'default',
  scheduled: 'blue',
  active: 'green',
  closed: 'purple',
};

export const SLUG = /^[a-z0-9][a-z0-9_-]{2,63}$/;
