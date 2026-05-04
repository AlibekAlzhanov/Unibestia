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
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readWalletBalance(wallet: unknown): number {
  const record = asRecord(wallet);

  return (
    readNumber(record?.balance) ??
    readNumber(record?.pointsBalance) ??
    readNumber(record?.bonusPoints) ??
    readNumber(record?.availableBalance) ??
    0
  );
}

export function readWalletTotalEarned(wallet: unknown): number {
  const record = asRecord(wallet);

  return (
    readNumber(record?.totalEarned) ??
    readNumber(record?.earnedTotal) ??
    readNumber(record?.lifetimeEarned) ??
    0
  );
}

export function readWalletTotalSpent(wallet: unknown): number {
  const record = asRecord(wallet);

  return (
    readNumber(record?.totalSpent) ??
    readNumber(record?.spentTotal) ??
    readNumber(record?.lifetimeSpent) ??
    0
  );
}

export function readTransactionItems(payload: unknown): unknown[] {
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

  if (Array.isArray(record.transactions)) {
    return record.transactions;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

export function readTransactionId(transaction: unknown): string {
  const record = asRecord(transaction);

  return (
    readString(record?.id) ??
    readString(record?.transactionId) ??
    Math.random().toString(36)
  );
}

export function readTransactionTitle(transaction: unknown): string {
  const record = asRecord(transaction);

  return (
    readString(record?.title) ??
    readString(record?.description) ??
    readString(record?.reason) ??
    "Операция"
  );
}

export function readTransactionType(transaction: unknown): string {
  const record = asRecord(transaction);

  return readString(record?.type) ?? readString(record?.transactionType) ?? "unknown";
}

export function readTransactionAmount(transaction: unknown): number {
  const record = asRecord(transaction);

  return readNumber(record?.amount) ?? readNumber(record?.points) ?? 0;
}

export function readTransactionCreatedAt(transaction: unknown): string | null {
  const record = asRecord(transaction);

  return readString(record?.createdAt) ?? readString(record?.created_at);
}

export function formatMoneyLike(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null): string {
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
