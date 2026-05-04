type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function nested(record: UnknownRecord | null, key: string): UnknownRecord | null {
  return record ? asRecord(record[key]) : null;
}

export function readReferralCode(summary: unknown): string {
  const record = asRecord(summary);
  const referralCode = nested(record, "referralCode");

  return readString(referralCode?.code) ?? "—";
}

export function readReferralStats(summary: unknown) {
  const stats = nested(asRecord(summary), "stats");

  return {
    invitedCount: readNumber(stats?.invitedCount),
    rewardedCount: readNumber(stats?.rewardedCount),
    pendingCount: readNumber(stats?.pendingCount),
    earnedPoints: readNumber(stats?.earnedPoints),
    availableBalance: readNumber(stats?.availableBalance),
  };
}

export function readRewardsAsReferrer(summary: unknown): unknown[] {
  const record = asRecord(summary);
  const rewards = record?.rewardsAsReferrer;

  return Array.isArray(rewards) ? rewards : [];
}

export function readAppliedReferral(summary: unknown): unknown | null {
  const record = asRecord(summary);

  return asRecord(record?.myAppliedReferral);
}

export function readRewardId(reward: unknown): string {
  const record = asRecord(reward);

  return readString(record?.id) ?? Math.random().toString(36);
}

export function readRewardStatus(reward: unknown): string {
  const record = asRecord(reward);

  return readString(record?.status) ?? "registered";
}

export function readRewardPoints(reward: unknown): number {
  const record = asRecord(reward);

  return (
    readNumber(record?.referrerRewardPoints) ||
    readNumber(record?.referredRewardPoints)
  );
}

export function readRewardCreatedAt(reward: unknown): string | null {
  const record = asRecord(reward);

  return readString(record?.createdAt);
}

export function readRewardUserName(reward: unknown): string {
  const record = asRecord(reward);
  const referredUser = nested(record, "referredUser");
  const referrerUser = nested(record, "referrerUser");
  const user = referredUser ?? referrerUser;

  const fullName = [
    readString(user?.firstName),
    readString(user?.lastName),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    readString(user?.displayName) ??
    (fullName || null) ??
    readString(user?.email) ??
    "Студент"
  );
}

export function formatReferralDate(value: string | null): string {
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

export function referralStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    registered: "Ожидает верификации",
    verified: "Готов к начислению",
    rewarded: "Начислен",
    cancelled: "Отменен",
    canceled: "Отменен",
  };

  return labels[status.toLowerCase()] ?? status;
}
