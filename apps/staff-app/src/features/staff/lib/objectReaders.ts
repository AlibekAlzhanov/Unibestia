export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

export function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readDateLike(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  return readString(value);
}

export function nested(record: UnknownRecord | null, key: string): UnknownRecord | null {
  return record ? asRecord(record[key]) : null;
}
