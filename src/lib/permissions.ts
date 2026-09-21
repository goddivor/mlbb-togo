import { useAuthStore } from '@/store/useStore';

/**
 * Client-side RBAC helpers. The source of truth is the backend
 * (`GET /auth/me` returns `permissions: string[]`, every admin endpoint is
 * guarded); these helpers only drive the UI (menus, page gating, dropdown).
 */

export interface AdminArea {
  permission: string;
  href: string;
}

/** Admin areas in "first allowed page" order. */
export const ADMIN_AREAS: AdminArea[] = [
  { permission: 'admin.league', href: '/admin/league' },
  { permission: 'admin.esport', href: '/admin/esport' },
  { permission: 'admin.tournaments', href: '/admin/tournaments' },
  { permission: 'admin.seasons', href: '/admin/seasons' },
  { permission: 'admin.matches', href: '/admin/matches' },
  { permission: 'admin.awards', href: '/admin/awards' },
  { permission: 'admin.draft', href: '/admin/draft' },
  { permission: 'admin.stream', href: '/admin/stream' },
  { permission: 'admin.catalog', href: '/admin/catalog' },
  { permission: 'admin.users', href: '/admin/users' },
  { permission: 'admin.requests', href: '/admin/requests' },
  { permission: 'admin.messages', href: '/admin/messages' },
  { permission: 'admin.rewards', href: '/admin/rewards' },
  { permission: 'admin.sponsors', href: '/admin/sponsors' },
  { permission: 'admin.logs', href: '/admin/logs' },
  { permission: 'admin.roles', href: '/admin/roles' },
];

type Subject = { permissions?: string[] | null; roleUser?: string | null } | null | undefined;

/**
 * Effective permissions of a user object. `permissions` comes from the API;
 * the `roleUser === 'admin'` fallback only covers a stale cached object.
 */
export function permissionsOf(user: Subject): string[] {
  if (!user) return [];
  if (Array.isArray(user.permissions)) return user.permissions;
  if (user.roleUser === 'admin') return ADMIN_AREAS.map((a) => a.permission);
  return [];
}

export function can(user: Subject, permission: string): boolean {
  return permissionsOf(user).includes(permission);
}

export function canAny(user: Subject, permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}

/** True when the user may enter the admin interface (any `admin.*`). */
export function hasAdminAccess(user: Subject): boolean {
  return permissionsOf(user).some((p) => p.startsWith('admin.'));
}

/** Permission required by an admin path (`/admin/users/...` -> `admin.users`). */
export function permissionForAdminPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const area = ADMIN_AREAS.find((a) => pathname === a.href || pathname.startsWith(`${a.href}/`));
  return area ? area.permission : null;
}

/**
 * Anti privilege escalation (mirrors the API): a user may only put in a role,
 * or hand out, permissions he holds himself. Only holders of the
 * Administrateur role may grant or remove Administrateur.
 */
export function canDelegatePermissions(user: Subject, permissions: readonly string[]): boolean {
  const held = new Set(permissionsOf(user));
  return permissions.every((p) => held.has(p));
}

export function canDelegateRole(
  user: (Subject & { roleIds?: string[] | null }) | null | undefined,
  role: { id: string; systemKey?: string | null; permissions: string[] },
  roles: { id: string; systemKey?: string | null }[],
): boolean {
  const mine = new Set(user?.roleIds ?? []);
  if (roles.some((r) => r.systemKey === 'admin' && mine.has(r.id))) return true;
  if (role.systemKey === 'admin') return false;
  return canDelegatePermissions(user, role.permissions);
}

/** True when the user may open an admin link (non-admin links always pass). */
export function canOpenHref(user: Subject, href: string): boolean {
  const required = permissionForAdminPath(href.split('?')[0]);
  return !required || can(user, required);
}

/**
 * Permission checks bound to the signed-in user, to hide the actions and
 * deep links the user cannot use (the API refuses them anyway).
 */
export function useCan() {
  const user = useAuthStore((s: any) => s.user);
  return {
    can: (permission: string) => can(user, permission),
    canOpen: (href: string) => canOpenHref(user, href),
  };
}

/** First admin page the user may open (`null` when none). */
export function firstAllowedAdminHref(user: Subject): string | null {
  return ADMIN_AREAS.find((a) => can(user, a.permission))?.href ?? null;
}
