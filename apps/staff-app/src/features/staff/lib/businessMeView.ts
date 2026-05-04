import { asRecord, readString } from "./objectReaders";

export function readUserEmail(value: unknown): string {
  const user = asRecord(asRecord(value)?.user);

  return readString(user?.email) ?? "—";
}

export function readUserName(value: unknown): string {
  const user = asRecord(asRecord(value)?.user);
  const fullName = [readString(user?.firstName), readString(user?.lastName)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return readString(user?.displayName) ?? fullName ?? readUserEmail(value);
}

export function readBusinessAccess(value: unknown): string {
  return readString(asRecord(value)?.businessAccess) ?? "no_access";
}

export function readPartnerName(value: unknown): string {
  const partner = asRecord(asRecord(value)?.partner);

  return (
    readString(partner?.brandName) ??
    readString(partner?.legalName) ??
    "Партнер не назначен"
  );
}

export function readPartnerStatus(value: unknown): string {
  const partner = asRecord(asRecord(value)?.partner);

  return readString(partner?.status) ?? "—";
}

export function readMembershipRole(value: unknown): string {
  const membership = asRecord(asRecord(value)?.membership);

  return readString(membership?.role) ?? "—";
}

export function canUseStaffApp(value: unknown): boolean {
  const businessAccess = readBusinessAccess(value);
  const role = readMembershipRole(value);

  return (
    businessAccess === "admin" ||
    businessAccess === "partner" ||
    businessAccess === "staff_mobile_only" ||
    ["owner", "manager", "staff"].includes(role)
  );
}
