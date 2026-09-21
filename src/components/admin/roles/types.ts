/** RBAC shapes returned by `/roles` and `/roles/permissions`. */

export type Localized = { fr: string; en: string };

export interface PermissionDef {
  key: string;
  group: string;
  label: Localized;
  description?: Localized;
  route?: string;
}

export interface PermissionCatalogue {
  groups: { key: string; label: Localized }[];
  permissions: PermissionDef[];
}

export interface RoleMember {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  isSystem: boolean;
  systemKey?: string | null;
  editable: boolean;
  deletable: boolean;
  permissions: string[];
  memberCount: number;
  members?: RoleMember[];
}

export const ROLE_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#64748b',
];

export const pick = (l: Localized | undefined, lang: string) =>
  (l && (lang === 'en' ? l.en : l.fr)) || '';
