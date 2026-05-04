type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function readCategoryItems(payload: unknown): unknown[] {
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

  if (Array.isArray(record.categories)) {
    return record.categories;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

export function readCategoryId(category: unknown): string {
  const record = asRecord(category);

  return (
    readString(record?.id) ??
    readString(record?.slug) ??
    readString(record?.name) ??
    Math.random().toString(36)
  );
}

export function readCategorySlug(category: unknown): string | null {
  const record = asRecord(category);

  return readString(record?.slug);
}

export function readCategoryName(category: unknown): string {
  const record = asRecord(category);

  return readString(record?.name) ?? readString(record?.title) ?? "Категория";
}
