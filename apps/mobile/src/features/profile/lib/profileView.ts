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

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function nested(record: UnknownRecord | null, key: string): UnknownRecord | null {
  return record ? asRecord(record[key]) : null;
}

export type DegreeValue = "bachelor" | "master" | "phd" | "other";

export function readUser(profile: unknown): UnknownRecord | null {
  return nested(asRecord(profile), "user");
}

export function readStudentProfile(profile: unknown): UnknownRecord | null {
  return nested(asRecord(profile), "studentProfile");
}

export function readDomainCheck(profile: unknown): UnknownRecord | null {
  return nested(asRecord(profile), "allowedStudentEmailDomain");
}

export function readProfileCompletion(profile: unknown): UnknownRecord | null {
  return nested(asRecord(profile), "profileCompletion");
}

export function readLatestVerification(profile: unknown): UnknownRecord | null {
  return nested(readStudentProfile(profile), "latestVerification");
}

export function readDisplayName(profile: unknown): string {
  const user = readUser(profile);
  const firstName = readString(user?.firstName);
  const lastName = readString(user?.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    readString(user?.displayName) ??
    (fullName || null) ??
    readString(user?.email) ??
    "Студент"
  );
}

export function readEmail(profile: unknown): string {
  return readString(readUser(profile)?.email) ?? "—";
}

export function readFirstName(profile: unknown): string {
  return readString(readUser(profile)?.firstName) ?? "";
}

export function readLastName(profile: unknown): string {
  return readString(readUser(profile)?.lastName) ?? "";
}

export function readPhone(profile: unknown): string {
  return readString(readUser(profile)?.phone) ?? "";
}

export function readDegree(profile: unknown): DegreeValue | "" {
  const degree = readString(readStudentProfile(profile)?.degree);

  if (
    degree === "bachelor" ||
    degree === "master" ||
    degree === "phd" ||
    degree === "other"
  ) {
    return degree;
  }

  return "";
}

export function readSpecialty(profile: unknown): string {
  return readString(readStudentProfile(profile)?.specialty) ?? "";
}

export function readCourse(profile: unknown): string {
  const course = readNumber(readStudentProfile(profile)?.course);

  return course ? String(course) : "";
}

export function readAdmissionDate(profile: unknown): string {
  return readString(readStudentProfile(profile)?.admissionDate) ?? "";
}

export function readUniversityName(profile: unknown): string {
  const domainCheck = readDomainCheck(profile);
  const domainUniversity = nested(domainCheck, "university");
  const studentUniversity = nested(readStudentProfile(profile), "university");

  return (
    readString(domainUniversity?.shortName) ??
    readString(domainUniversity?.name) ??
    readString(studentUniversity?.shortName) ??
    readString(studentUniversity?.name) ??
    "Не определен"
  );
}

export function isAllowedStudentDomain(profile: unknown): boolean {
  return readBoolean(readDomainCheck(profile)?.isAllowed);
}

export function readVerificationStatus(profile: unknown): string {
  return readString(readStudentProfile(profile)?.verificationStatus) ?? "unverified";
}

export function readVerificationReviewComment(profile: unknown): string | null {
  return readString(readLatestVerification(profile)?.reviewComment);
}

export function readProfileCompletionPercent(profile: unknown): number {
  return readNumber(readProfileCompletion(profile)?.percentage) ?? 0;
}

export function canSubmitVerification(profile: unknown): boolean {
  return readBoolean(readProfileCompletion(profile)?.canSubmitVerification);
}

export function readRequiredFields(profile: unknown): Array<{
  key: string;
  label: string;
  isComplete: boolean;
}> {
  const completion = readProfileCompletion(profile);
  const fields = completion?.requiredFields;

  if (!Array.isArray(fields)) {
    return [];
  }

  return fields
    .map((field) => {
      const record = asRecord(field);

      return {
        key: readString(record?.key) ?? "",
        label: readString(record?.label) ?? "Поле",
        isComplete: readBoolean(record?.isComplete),
      };
    })
    .filter((field) => field.key);
}

export function degreeLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    bachelor: "Бакалавриат",
    master: "Магистратура",
    phd: "PhD / Докторантура",
    other: "Другое",
  };

  return value ? labels[value] ?? value : "Не указано";
}

export function verificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    unverified: "Не подтвержден",
    pending_review: "На проверке",
    verified: "Подтвержден",
    rejected: "Отклонен",
    expired: "Истек",
  };

  return labels[status] ?? status;
}
