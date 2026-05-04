type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readNotificationItems(payload: unknown): unknown[] {
  const record = asRecord(payload);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!record) {
    return [];
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.notifications)) {
    return record.notifications;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

export function readUnreadCount(payload: unknown): number {
  const record = asRecord(payload);

  return readNumber(record?.unreadCount) ?? 0;
}

export function readNotificationId(notification: unknown): string | null {
  const record = asRecord(notification);

  return readString(record?.id) ?? readString(record?.notificationId);
}

export function readNotificationTitle(notification: unknown): string {
  const record = asRecord(notification);

  return readString(record?.title) ?? "Уведомление";
}

export function readNotificationBody(notification: unknown): string {
  const record = asRecord(notification);

  return readString(record?.body) ?? "";
}

export function readNotificationType(notification: unknown): string {
  const record = asRecord(notification);

  return readString(record?.type) ?? "notification";
}

export function isNotificationRead(notification: unknown): boolean {
  const record = asRecord(notification);

  return readBoolean(record?.isRead);
}

export function readNotificationCreatedAt(notification: unknown): string | null {
  const record = asRecord(notification);

  return (
    readString(record?.createdAt) ??
    readString(record?.sentAt) ??
    readString(record?.readAt)
  );
}

export function formatNotificationDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getNotificationIcon(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("referral")) {
    return "gift-outline" as const;
  }

  if (normalized.includes("verification")) {
    return "shield-checkmark-outline" as const;
  }

  if (normalized.includes("wallet") || normalized.includes("bonus")) {
    return "wallet-outline" as const;
  }

  if (normalized.includes("redemption") || normalized.includes("qr")) {
    return "qr-code-outline" as const;
  }

  return "notifications-outline" as const;
}
