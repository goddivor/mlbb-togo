// Minimal GraphQL client (native fetch, read-only).
// The GraphQL endpoint shares the REST host but without the /api prefix.
// Reads process.env directly (NOT API_URL from ./api) to avoid an api<->gql
// circular import that breaks module init during SSR.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

// Derive the GraphQL URL from the REST base: .../api -> .../graphql
export const GQL_URL = `${API_BASE.replace(/\/api\/?$/, '')}/graphql`;

/**
 * Execute a GraphQL query and return typed `data`.
 * Throws an error if the server returns `errors`.
 */
// Cache + de-duplication (same idea as the REST client): avoids StrictMode
// duplicates and identical re-reads on the landing.
const GQL_TTL = 30_000; // 30s
const cache = new Map<string, { at: number; data: any }>();
const inFlight = new Map<string, Promise<any>>();

export async function gql<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const key = query + '|' + JSON.stringify(variables ?? {});
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < GQL_TTL) return hit.data as T;
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const exec = (async () => {
    const res = await fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });
    const json = await res.json();
    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message || 'Erreur GraphQL');
    }
    cache.set(key, { at: Date.now(), data: json.data });
    return json.data as T;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, exec);
  return exec;
}
