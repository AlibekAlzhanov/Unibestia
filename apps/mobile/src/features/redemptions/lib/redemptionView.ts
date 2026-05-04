type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNestedRecord(record: UnknownRecord, key: string): UnknownRecord | null {
  return asRecord(record[key]);
}

export function readRedemptionItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.redemptions)) {
    return record.redemptions;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

export function readRedemptionId(redemption: unknown): string | null {
  const record = asRecord(redemption);

  if (!record) {
    return null;
  }

  return readString(record.id) ?? readString(record.redemptionId);
}

export function readQrToken(redemption: unknown): string | null {
  const record = asRecord(redemption);

  if (!record) {
    return null;
  }

  return (
    readString(record.qrToken) ??
    readString(record.qr_token) ??
    readString(record.token) ??
    readString(record.qrCode) ??
    readString(record.code)
  );
}

export function readRedemptionStatus(redemption: unknown): string {
  const record = asRecord(redemption);

  if (!record) {
    return "unknown";
  }

  return readString(record.status) ?? "unknown";
}

export function readCreatedAt(redemption: unknown): string | null {
  const record = asRecord(redemption);

  if (!record) {
    return null;
  }

  return readString(record.createdAt) ?? readString(record.created_at);
}

export function readExpiresAt(redemption: unknown): string | null {
  const record = asRecord(redemption);

  if (!record) {
    return null;
  }

  return (
    readString(record.expiresAt) ??
    readString(record.expires_at) ??
    readString(record.expiredAt) ??
    readString(record.expired_at)
  );
}

export function readOfferTitle(redemption: unknown): string {
  const record = asRecord(redemption);

  if (!record) {
    return "Предложение";
  }

  const offer = readNestedRecord(record, "offer");

  return (
    readString(offer?.title) ??
    readString(record.offerTitle) ??
    readString(record.title) ??
    "Предложение"
  );
}

export function readPartnerName(redemption: unknown): string {
  const record = asRecord(redemption);

  if (!record) {
    return "Партнер";
  }

  const offer = readNestedRecord(record, "offer");
  const partner = offer ? readNestedRecord(offer, "partner") : null;

  return (
    readString(partner?.brandName) ??
    readString(record.partnerBrandName) ??
    readString(record.partnerName) ??
    "Партнер"
  );
}

export function readDiscountAmount(redemption: unknown): number | null {
  const record = asRecord(redemption);

  if (!record) {
    return null;
  }

  return readNumber(record.discountAmount) ?? readNumber(record.discount_amount);
}

export function formatRedemptionDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isFinalRedemptionStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return ["used", "cancelled", "canceled", "expired"].includes(normalized);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Активен",
    active: "Активен",
    used: "Использован",
    expired: "Истек",
    cancelled: "Отменен",
    canceled: "Отменен",
  };

  return labels[status.trim().toLowerCase()] ?? status;
}
