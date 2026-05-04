export const STAFF_QR_MIN_LENGTH = 16;

export function normalizeStaffQrToken(value: string): string {
  return value.trim();
}

export function validateStaffQrToken(value: string): string | null {
  const normalized = normalizeStaffQrToken(value);

  if (!normalized) {
    return "Введите QR token или отсканируйте QR-код студента.";
  }

  if (normalized.length < STAFF_QR_MIN_LENGTH) {
    return `QR token должен быть не короче ${STAFF_QR_MIN_LENGTH} символов.`;
  }

  return null;
}

export function maskStaffQrToken(value: string): string {
  const normalized = normalizeStaffQrToken(value);

  if (normalized.length <= 10) {
    return normalized;
  }

  return `${normalized.slice(0, 6)}••••${normalized.slice(-4)}`;
}

export function readQrTokenFromScannerData(data: string): string {
  const trimmed = data.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const token = record.qrToken ?? record.token ?? record.code;

      if (typeof token === "string") {
        return token.trim();
      }
    }
  } catch {
    // QR can be a plain token string.
  }

  return trimmed;
}
