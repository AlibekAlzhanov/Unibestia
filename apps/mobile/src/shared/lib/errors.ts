type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findNestedCode(record: UnknownRecord | null): string | null {
  if (!record) {
    return null;
  }

  const directCode = readString(record.code);
  const dataCode = readString(asRecord(record.data)?.code);
  const shapeCode = readString(asRecord(asRecord(record.shape)?.data)?.code);

  return directCode ?? dataCode ?? shapeCode;
}

function findNestedStatus(record: UnknownRecord | null): number | null {
  if (!record) {
    return null;
  }

  const candidates = [
    record.status,
    record.statusCode,
    asRecord(record.data)?.httpStatus,
    asRecord(record.data)?.status,
    asRecord(record.data)?.statusCode,
    asRecord(asRecord(record.shape)?.data)?.httpStatus,
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

export function readErrorCode(error: unknown): string | null {
  return findNestedCode(asRecord(error));
}

export function readErrorStatus(error: unknown): number | null {
  return findNestedStatus(asRecord(error));
}

export function isUnauthorizedError(error: unknown): boolean {
  const code = readErrorCode(error);
  const status = readErrorStatus(error);
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    status === 401 ||
    code === "UNAUTHORIZED" ||
    message.includes("unauthorized") ||
    message.includes("auth token") ||
    message.includes("authentication token") ||
    message.includes("session token")
  );
}

export function isForbiddenError(error: unknown): boolean {
  const code = readErrorCode(error);
  const status = readErrorStatus(error);
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    status === 403 ||
    code === "FORBIDDEN" ||
    message.includes("forbidden") ||
    message.includes("access is required") ||
    message.includes("no access") ||
    message.includes("нет доступа")
  );
}

export function isNotFoundError(error: unknown): boolean {
  const code = readErrorCode(error);
  const status = readErrorStatus(error);
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    status === 404 ||
    code === "NOT_FOUND" ||
    message.includes("not found") ||
    message.includes("не найден")
  );
}

export function isNetworkError(error: unknown): boolean {
  const message = findMessage(error)?.toLowerCase() ?? "";

  return (
    message.includes("network request failed") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("could not connect") ||
    message.includes("connection refused")
  );
}

export function readErrorMessage(error: unknown, fallback = "Что-то пошло не так") {
  if (isUnauthorizedError(error)) {
    return "Сессия истекла или не найдена. Войди в аккаунт заново.";
  }

  if (isForbiddenError(error)) {
    return "Нет доступа к этому действию или разделу.";
  }

  if (isNotFoundError(error)) {
    return "Запрошенные данные не найдены.";
  }

  if (isNetworkError(error)) {
    return "Backend недоступен. Проверь, что сервер запущен и адрес API указан правильно.";
  }

  const message = findMessage(error);

  if (!message) {
    return fallback;
  }

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("only approved student email domains")) {
    return "QR доступен только для подтвержденного студенческого email-домена.";
  }

  if (normalizedMessage.includes("partner staff or admin access is required")) {
    return "Для этого действия нужен доступ сотрудника партнера или администратора.";
  }

  if (normalizedMessage.includes("multiple active partner memberships")) {
    return "У аккаунта несколько активных партнерских ролей. Нужно оставить одну активную роль.";
  }

  if (normalizedMessage.includes("qr operator")) {
    return "Нет доступа к операциям с QR-кодом.";
  }

  if (normalizedMessage.includes("qr token")) {
    return "QR-код недействителен или уже не может быть использован.";
  }

  if (normalizedMessage.includes("redemption") && normalizedMessage.includes("already")) {
    return "Этот QR уже был обработан.";
  }

  return message;
}

export function readErrorTitle(error: unknown, fallback = "Не удалось выполнить действие") {
  if (isUnauthorizedError(error)) {
    return "Нужно войти заново";
  }

  if (isForbiddenError(error)) {
    return "Нет доступа";
  }

  if (isNotFoundError(error)) {
    return "Не найдено";
  }

  if (isNetworkError(error)) {
    return "Backend недоступен";
  }

  return fallback;
}

export function readErrorActionLabel(error: unknown, fallback = "Повторить") {
  if (isUnauthorizedError(error)) {
    return "Обновить";
  }

  if (isNetworkError(error)) {
    return "Повторить";
  }

  return fallback;
}
