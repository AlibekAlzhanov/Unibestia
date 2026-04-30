export function getBackendApiUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_TRPC_URL ??
    "http://localhost:3001";

  const trimmedUrl = rawUrl.trim();

  if (
    !trimmedUrl ||
    trimmedUrl === "/" ||
    trimmedUrl === "/trpc" ||
    trimmedUrl === "/trpc/"
  ) {
    return "http://localhost:3001";
  }

  const normalizedUrl = trimmedUrl
    .replace(/\/trpc\/?$/, "")
    .replace(/\/+$/, "");

  if (!normalizedUrl || normalizedUrl === "/") {
    return "http://localhost:3001";
  }

  return normalizedUrl;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "На проверке",
    approved: "Подтверждено",
    rejected: "Отклонено",
    expired: "Истекло",
  };

  return labels[status] ?? status;
}

export function statusClass(status: string): string {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "expired") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

export function degreeLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    bachelor: "Бакалавриат",
    master: "Магистратура",
    phd: "Докторантура / PhD",
    other: "Другое",
  };

  return value ? labels[value] ?? value : "—";
}

export function checkClassName(status: "pass" | "warning" | "fail"): string {
  if (status === "pass") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "warning") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export function recommendationLabel(value: string): string {
  const labels: Record<string, string> = {
    approve: "Рекомендуется approve",
    manual_review: "Нужна ручная проверка",
    reject: "Рекомендуется reject",
  };

  return labels[value] ?? value;
}