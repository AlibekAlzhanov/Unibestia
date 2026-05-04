export function readErrorMessage(error: unknown, fallback = "Что-то пошло не так") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return fallback;
}

