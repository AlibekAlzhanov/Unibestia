type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findCode(error: unknown): string | null {
  const record = asRecord(error);

  return (
    readString(record?.code) ??
    readString(asRecord(record?.data)?.code) ??
    readString(asRecord(asRecord(record?.shape)?.data)?.code)
  );
}

function findStatus(error: unknown): number | null {
  const record = asRecord(error);
  const candidates = [
    record?.status,
    record?.statusCode,
    asRecord(record?.data)?.httpStatus,
    asRecord(record?.data)?.status,
    asRecord(record?.data)?.statusCode,
    asRecord(asRecord(record?.shape)?.data)?.httpStatus,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim()) {
      const parsed = Number(candidate);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function findMessage(error: unknown): string | null {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  const record = asRecord(error);

  if (!record) {
    return null;
  }

  const message = record.message;

  if (Array.isArray(message)) {
    return message
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join(", ");
  }

  return (
    readString(message) ??
    readString(record.error) ??
    readString(asRecord(record.data)?.message) ??
    readString(asRecord(record.shape)?.message)
  );
}

export function isUnauthorizedError(error: unknown): boolean {
  const status = findStatus(error);
  const code = findCode(error);
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    status === 401 ||
    code === "UNAUTHORIZED" ||
    message.includes("unauthorized") ||
    message.includes("authenticated clerk")
  );
}

export function isForbiddenError(error: unknown): boolean {
  const status = findStatus(error);
  const code = findCode(error);
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    status === 403 ||
    code === "FORBIDDEN" ||
    message.includes("forbidden") ||
    message.includes("partner staff") ||
    message.includes("admin access is required") ||
    message.includes("current user is not assigned to a partner")
  );
}

export function isNotFoundError(error: unknown): boolean {
  const status = findStatus(error);
  const code = findCode(error);
  const message = findMessage(error)?.toLowerCase() ?? "";

  return status === 404 || code === "NOT_FOUND" || message.includes("not found");
}

export function isNetworkError(error: unknown): boolean {
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    message.includes("network request failed") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("connection refused")
  );
}

export function readErrorMessage(
  error: unknown,
  fallback = "Что-то пошло не так"
) {
  if (isUnauthorizedError(error)) {
    return "Сессия истекла или не найдена. Войди заново.";
  }

  if (isForbiddenError(error)) {
    return "Нет staff-доступа. Partner owner/manager должен добавить этот email в сотрудники.";
  }

  if (isNotFoundError(error)) {
    return "Данные не найдены. QR может быть неверным или пользователь ещё не создан в системе.";
  }

  if (isNetworkError(error)) {
    return "Backend недоступен. Проверь, что сервер запущен и EXPO_PUBLIC_TRPC_URL указан правильно.";
  }

  const message = findMessage(error);

  if (!message) {
    return fallback;
  }

  const lower = message.toLowerCase();

  if (lower.includes("multiple active partner memberships")) {
    return "У аккаунта несколько активных партнеров. Для QR операций должен быть только один активный партнер.";
  }

  if (lower.includes("qr token")) {
    return "QR-код недействителен, истек или уже был обработан.";
  }

  return message;
}

export function readErrorTitle(
  error: unknown,
  fallback = "Не удалось выполнить действие"
) {
  if (isUnauthorizedError(error)) {
    return "Нужно войти заново";
  }

  if (isForbiddenError(error)) {
    return "Нет staff-доступа";
  }

  if (isNotFoundError(error)) {
    return "Не найдено";
  }

  if (isNetworkError(error)) {
    return "Backend недоступен";
  }

  return fallback;
}

export function readErrorActionLabel(
  _error: unknown,
  fallback = "Повторить"
) {
  return fallback;
}
