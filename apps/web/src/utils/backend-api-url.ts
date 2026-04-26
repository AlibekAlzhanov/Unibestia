export function getBackendApiUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_TRPC_URL ??
    "http://localhost:3001";

  return rawUrl.replace(/\/trpc\/?$/, "").replace(/\/+$/, "");
}
