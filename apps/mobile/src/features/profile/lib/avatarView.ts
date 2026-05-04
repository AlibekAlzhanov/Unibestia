import { env } from "../../../shared/config/env";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function normalizeAvatarUrl(value: string | null | undefined): string | null {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    return null;
  }

  try {
    const apiBase = new URL(env.EXPO_PUBLIC_API_URL);

    if (rawUrl.startsWith("//")) {
      return `https:${rawUrl}`;
    }

    const url = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? new URL(rawUrl)
      : new URL(rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`, apiBase);

    // Website can render localhost URLs, but Android Emulator cannot.
    // On emulator localhost points to the emulator itself, not to the PC backend.
    if (isLocalhost(url.hostname) && !isLocalhost(apiBase.hostname)) {
      url.protocol = apiBase.protocol;
      url.hostname = apiBase.hostname;
      url.port = apiBase.port;
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function readProfileUser(profile: unknown): UnknownRecord | null {
  return asRecord(asRecord(profile)?.user);
}

export function readAvatarUrl(profile: unknown): string | null {
  return normalizeAvatarUrl(readString(readProfileUser(profile)?.avatarUrl));
}

export function readProfileDisplayName(profile: unknown): string {
  const user = readProfileUser(profile);

  const firstName = readString(user?.firstName);
  const lastName = readString(user?.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    readString(user?.displayName) ??
    (fullName || null) ??
    readString(user?.email) ??
    "Студент"
  );
}

export function readProfileEmail(profile: unknown): string {
  return readString(readProfileUser(profile)?.email) ?? "—";
}

export function makeInitials(displayName?: string | null, email?: string | null): string {
  const source = displayName?.trim() || email?.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
