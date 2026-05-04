type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readDateLike(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  return readString(value);
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function nested(record: UnknownRecord | null, key: string): UnknownRecord | null {
  return record ? asRecord(record[key]) : null;
}

export function readRedemptionId(redemption: unknown): string | null {
  return readString(asRecord(redemption)?.id);
}

export function readRedemptionStatus(redemption: unknown): string {
  return readString(asRecord(redemption)?.status) ?? "created";
}

export function isRedemptionUsed(redemption: unknown): boolean {
  const status = readRedemptionStatus(redemption).toLowerCase();

  return status === "used" || status.includes("used") || Boolean(readRedemptionUsedAt(redemption));
}

export function readRedemptionCode(redemption: unknown): string {
  const record = asRecord(redemption);

  return (
    readString(record?.code) ??
    readString(record?.qrCode) ??
    readString(record?.qrToken) ??
    readString(record?.token) ??
    readString(record?.id) ??
    "—"
  );
}

export function readRedemptionQrPayload(redemption: unknown): string {
  const record = asRecord(redemption);

  return (
    readString(record?.qrPayload) ??
    readString(record?.qrData) ??
    readString(record?.qrCode) ??
    readString(record?.qrToken) ??
    readString(record?.code) ??
    readString(record?.token) ??
    readString(record?.id) ??
    ""
  );
}

export function readRedemptionCreatedAt(redemption: unknown): string | null {
  const record = asRecord(redemption);

  return readDateLike(record?.createdAt) ?? readDateLike(record?.created_at);
}

export function readRedemptionExpiresAt(redemption: unknown): string | null {
  const record = asRecord(redemption);

  return (
    readDateLike(record?.expiresAt) ??
    readDateLike(record?.expires_at) ??
    readDateLike(record?.validUntil) ??
    readDateLike(record?.valid_until) ??
    readDateLike(record?.qrExpiresAt)
  );
}

export function readRedemptionUsedAt(redemption: unknown): string | null {
  const record = asRecord(redemption);

  return (
    readDateLike(record?.usedAt) ??
    readDateLike(record?.redeemedAt) ??
    readDateLike(record?.activatedAt) ??
    readDateLike(record?.used_at)
  );
}

export function readOfferId(redemption: unknown): string | null {
  const record = asRecord(redemption);
  const offer = nested(record, "offer");

  return readString(offer?.id) ?? readString(record?.offerId);
}

export function readOfferTitle(redemption: unknown): string {
  const offer = nested(asRecord(redemption), "offer");

  return readString(offer?.title) ?? readString(asRecord(redemption)?.offerTitle) ?? "Скидка";
}

export function readOfferBenefitText(redemption: unknown): string | null {
  const offer = nested(asRecord(redemption), "offer");
  const record = asRecord(redemption);

  return (
    readString(offer?.benefitText) ??
    readString(offer?.benefit) ??
    readString(record?.benefitText) ??
    readString(record?.benefit)
  );
}

export function readPartnerName(redemption: unknown): string {
  const record = asRecord(redemption);
  const offer = nested(record, "offer");
  const partnerFromOffer = nested(offer, "partner");
  const partner = nested(record, "partner") ?? partnerFromOffer;

  return (
    readString(partner?.brandName) ??
    readString(partner?.name) ??
    readString(record?.partnerName) ??
    "Партнер"
  );
}

export function readLocationName(redemption: unknown): string | null {
  const record = asRecord(redemption);
  const location = nested(record, "location") ?? nested(record, "partnerLocation");

  return (
    readString(location?.name) ??
    readString(location?.title) ??
    readString(location?.branchName) ??
    readString(record?.locationName)
  );
}

export function readLocationAddress(redemption: unknown): string | null {
  const record = asRecord(redemption);
  const location = nested(record, "location") ?? nested(record, "partnerLocation");

  return (
    readString(location?.address) ??
    readString(location?.fullAddress) ??
    readString(record?.locationAddress)
  );
}

export function readWalletPoints(redemption: unknown): number | null {
  const record = asRecord(redemption);

  return (
    readNumber(record?.points) ??
    readNumber(record?.bonusPoints) ??
    readNumber(record?.walletPoints) ??
    readNumber(record?.bonusEarned)
  );
}

export function isRedemptionExpired(redemption: unknown): boolean {
  const expiresAt = readRedemptionExpiresAt(redemption);

  if (!expiresAt) {
    return false;
  }

  const timestamp = new Date(expiresAt).getTime();

  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

export function redemptionStatusLabel(redemption: unknown): string {
  const status = readRedemptionStatus(redemption).toLowerCase();

  if (status.includes("used") || status.includes("redeemed") || status.includes("activated")) {
    return "Использован";
  }

  if (status.includes("expired") || isRedemptionExpired(redemption)) {
    return "Истек";
  }

  if (status.includes("cancel")) {
    return "Отменен";
  }

  if (status.includes("pending")) {
    return "Ожидает";
  }

  return "Активен";
}

export function redemptionStatusTone(redemption: unknown): "success" | "warning" | "danger" | "primary" | "neutral" {
  const status = readRedemptionStatus(redemption).toLowerCase();

  if (status.includes("used") || status.includes("redeemed") || status.includes("activated")) {
    return "success";
  }

  if (status.includes("expired") || isRedemptionExpired(redemption)) {
    return "danger";
  }

  if (status.includes("cancel")) {
    return "danger";
  }

  if (status.includes("pending")) {
    return "warning";
  }

  return "primary";
}

export function formatRedemptionDate(value: string | null): string {
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRemainingMs(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.max(0, timestamp - Date.now());
}

export function formatRemainingTime(ms: number | null): string {
  if (ms === null) {
    return "Без срока";
  }

  if (ms <= 0) {
    return "Истек";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} дн. ${hours} ч.`;
  }

  if (hours > 0) {
    return `${hours} ч. ${minutes} мин.`;
  }

  return `${minutes} мин. ${seconds} сек.`;
}
