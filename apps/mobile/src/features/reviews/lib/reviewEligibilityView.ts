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

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

export function readCanReview(eligibility: unknown): boolean {
  return readBoolean(asRecord(eligibility)?.canReview);
}

export function readReviewableRedemptionId(eligibility: unknown): string | null {
  return readString(asRecord(eligibility)?.reviewableRedemptionId);
}

export function readUsedCount(eligibility: unknown): number {
  return readNumber(asRecord(eligibility)?.usedCount) ?? 0;
}

export function readReviewedCount(eligibility: unknown): number {
  return readNumber(asRecord(eligibility)?.reviewedCount) ?? 0;
}

export function readUsedRedemptions(eligibility: unknown): unknown[] {
  const value = asRecord(eligibility)?.usedRedemptions;

  return Array.isArray(value) ? value : [];
}

export function readReviewFromUsedRedemption(redemption: unknown): unknown | null {
  return asRecord(redemption)?.review ?? null;
}

export function readReviewRating(review: unknown): number | null {
  return readNumber(asRecord(review)?.rating);
}

export function readReviewText(review: unknown): string | null {
  return readString(asRecord(review)?.text);
}

export function readReviewCreatedAt(review: unknown): string | null {
  return readString(asRecord(review)?.createdAt);
}

export function readLatestExistingReview(eligibility: unknown): unknown | null {
  const usedRedemptions = readUsedRedemptions(eligibility);

  for (const redemption of usedRedemptions) {
    const review = readReviewFromUsedRedemption(redemption);

    if (review) {
      return review;
    }
  }

  return null;
}

export function formatReviewDate(value: string | null): string {
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
