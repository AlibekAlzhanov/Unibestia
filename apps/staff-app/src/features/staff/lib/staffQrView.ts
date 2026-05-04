import {
  asRecord,
  nested,
  readDateLike,
  readNumber,
  readString,
} from "./objectReaders";

export function readRedemptionStatus(value: unknown): string {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;

  return readString(redemption?.status) ?? "unknown";
}

export function readOfferTitle(value: unknown): string {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;
  const offer = nested(record, "offer") ?? nested(redemption, "offer");

  return (
    readString(offer?.title) ??
    readString(record?.offerTitle) ??
    readString(redemption?.offerTitle) ??
    "Скидка"
  );
}

export function readPartnerName(value: unknown): string {
  const record = asRecord(value);
  const partner =
    nested(record, "partner") ??
    nested(nested(record, "offer"), "partner") ??
    nested(nested(record, "redemption"), "partner");

  return (
    readString(partner?.brandName) ??
    readString(partner?.name) ??
    readString(record?.partnerName) ??
    "Партнер"
  );
}

export function readLocationName(value: unknown): string | null {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;
  const location = nested(record, "location") ?? nested(redemption, "location");

  return (
    readString(location?.name) ??
    readString(location?.title) ??
    readString(location?.address) ??
    readString(record?.locationName)
  );
}

export function readStudentLabel(value: unknown): string {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;
  const student =
    nested(record, "student") ??
    nested(record, "user") ??
    nested(redemption, "student") ??
    nested(redemption, "user");

  return (
    readString(student?.displayName) ??
    readString(student?.email) ??
    readString(record?.studentEmail) ??
    "Студент"
  );
}

export function readExpiresAt(value: unknown): string | null {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;

  return (
    readDateLike(redemption?.qrExpiresAt) ??
    readDateLike(redemption?.expiresAt) ??
    readDateLike(record?.qrExpiresAt) ??
    readDateLike(record?.expiresAt)
  );
}

export function readUsedAt(value: unknown): string | null {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;

  return readDateLike(redemption?.usedAt) ?? readDateLike(record?.usedAt);
}

export function readBonusEarned(value: unknown): number | null {
  const record = asRecord(value);
  const redemption = nested(record, "redemption") ?? record;

  return (
    readNumber(record?.bonusEarned) ??
    readNumber(redemption?.bonusEarned) ??
    readNumber(record?.points)
  );
}

export function isQrActive(value: unknown): boolean {
  const status = readRedemptionStatus(value).toLowerCase();

  return ["active", "created", "pending", "issued"].includes(status);
}

export function isQrUsed(value: unknown): boolean {
  const status = readRedemptionStatus(value).toLowerCase();

  return status.includes("used") || Boolean(readUsedAt(value));
}

export function isQrExpired(value: unknown): boolean {
  const status = readRedemptionStatus(value).toLowerCase();

  if (status.includes("expired")) {
    return true;
  }

  const expiresAt = readExpiresAt(value);

  if (!expiresAt) {
    return false;
  }

  const timestamp = new Date(expiresAt).getTime();

  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

export function isQrCancelled(value: unknown): boolean {
  const status = readRedemptionStatus(value).toLowerCase();

  return status.includes("cancel");
}

export function canConfirmQr(value: unknown): boolean {
  return (
    isQrActive(value) &&
    !isQrExpired(value) &&
    !isQrUsed(value) &&
    !isQrCancelled(value)
  );
}

export function statusLabel(value: unknown): string {
  if (isQrUsed(value)) return "Использован";
  if (isQrExpired(value)) return "Истек";
  if (isQrCancelled(value)) return "Отменен";
  if (isQrActive(value)) return "Активен";

  return readRedemptionStatus(value);
}

export function statusTone(
  value: unknown
): "success" | "warning" | "danger" | "primary" {
  if (isQrUsed(value)) return "success";
  if (isQrExpired(value) || isQrCancelled(value)) return "danger";
  if (isQrActive(value)) return "primary";

  return "warning";
}

export function formatDate(value: string | null): string {
  if (!value) return "—";

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

export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${number.toLocaleString("ru-RU")} ₸`
    : String(value);
}
