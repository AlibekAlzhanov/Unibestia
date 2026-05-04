import { env } from "../config/env";

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function normalizeBackendHost(url: URL, apiBase: URL): URL {
  if (isLocalhost(url.hostname) && !isLocalhost(apiBase.hostname)) {
    url.protocol = apiBase.protocol;
    url.hostname = apiBase.hostname;
    url.port = apiBase.port;
  }

  return url;
}

export function normalizeBackendFileUrl(value: string | null | undefined): string | null {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    return null;
  }

  try {
    const apiBase = new URL(env.EXPO_PUBLIC_API_URL);

    // R2 URI is not a browser/mobile URL.
    // It must be resolved by backend into a stream or signed URL.
    if (rawUrl.startsWith("r2://")) {
      const downloadUrl = new URL("/student-verifications/document/open", apiBase);
      downloadUrl.searchParams.set("uri", rawUrl);

      return downloadUrl.toString();
    }

    if (rawUrl.startsWith("//")) {
      return `https:${rawUrl}`;
    }

    const url = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? new URL(rawUrl)
      : new URL(rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`, apiBase);

    return normalizeBackendHost(url, apiBase).toString();
  } catch {
    return rawUrl;
  }
}
