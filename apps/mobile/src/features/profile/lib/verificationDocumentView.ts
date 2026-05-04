import { normalizeBackendFileUrl } from "../../../shared/lib/normalizeBackendFileUrl";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nested(record: UnknownRecord | null, key: string): UnknownRecord | null {
  return record ? asRecord(record[key]) : null;
}

export function readStudentProfile(profile: unknown): UnknownRecord | null {
  return nested(asRecord(profile), "studentProfile");
}

export function readLatestVerification(profile: unknown): UnknownRecord | null {
  return nested(readStudentProfile(profile), "latestVerification");
}

export function readLatestVerificationId(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.id);
}

export function readLatestVerificationStatus(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.status);
}

export function readLatestVerificationMethod(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.method);
}

export function readLatestVerificationRawDocumentUrl(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.documentUrl);
}

export function readLatestVerificationDocumentUrl(profile: unknown): string | null {
  const verificationId = readLatestVerificationId(profile);
  const rawUrl = readLatestVerificationRawDocumentUrl(profile);

  /**
   * Backend already has a protected streaming endpoint:
   * GET /student-verifications/documents/:verificationId
   *
   * If DB stores r2://..., mobile must not open that directly.
   * It should download through the protected backend endpoint.
   */
  if (verificationId && rawUrl?.startsWith("r2://")) {
    return normalizeBackendFileUrl(`/student-verifications/documents/${verificationId}`);
  }

  return normalizeBackendFileUrl(rawUrl);
}

export function readLatestVerificationDocumentType(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.documentType);
}

export function readLatestVerificationReviewComment(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.reviewComment);
}

export function readLatestVerificationCreatedAt(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.createdAt);
}

export function formatVerificationDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function verificationRequestStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    pending: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
    expired: "Истекло",
  };

  return status ? labels[status] ?? status : "Заявки пока нет";
}
