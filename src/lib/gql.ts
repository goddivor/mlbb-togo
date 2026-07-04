// Client GraphQL minimal (fetch natif, lecture seule).
// L'endpoint GraphQL est sur le même hôte que le REST mais sans le préfixe /api.
// On lit process.env directement (et PAS API_URL depuis ./api) pour éviter un
// import circulaire api.ts <-> gql.ts qui casse l'initialisation en SSR.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

// Dérive l'URL GraphQL depuis la base REST : .../api -> .../graphql
export const GQL_URL = `${API_BASE.replace(/\/api\/?$/, '')}/graphql`;

/**
 * Exécute une requête GraphQL et renvoie `data` typé.
 * Lève une erreur si le serveur renvoie des `errors`.
 */
export async function gql<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
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
  return json.data as T;
}
