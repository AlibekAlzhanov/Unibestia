import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type MobileQueryScope =
  | "catalog"
  | "profile"
  | "redemptions"
  | "notifications"
  | "wallet";

function stringifyQueryKey(queryKey: QueryKey): string {
  try {
    return JSON.stringify(queryKey);
  } catch {
    return String(queryKey);
  }
}

function queryKeyMatchesScope(queryKey: QueryKey, scope: MobileQueryScope): boolean {
  const key = stringifyQueryKey(queryKey);

  return (
    key.includes(`"${scope}"`) ||
    key.includes(scope)
  );
}

export async function invalidateMobileQueries(
  queryClient: QueryClient,
  scopes: MobileQueryScope[]
): Promise<void> {
  await queryClient.invalidateQueries({
    predicate: (query) =>
      scopes.some((scope) => queryKeyMatchesScope(query.queryKey, scope)),
  });
}
