"use client";

import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useTRPCClient } from "@/utils/trpc";

type ValidationResult = {
  id: string;
  status: string;
  qrToken: string;
  qrExpiresAt: Date | string | null;
  usedAt: Date | string | null;
  cancelledAt: Date | string | null;
  offer?: {
    title?: string | null;
    shortDescription?: string | null;
    discountType?: string | null;
    discountValue?: string | null;
  } | null;
  student?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    status?: string | null;
  } | null;
  partner?: {
    brandName?: string | null;
  } | null;
  location?: {
    name?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
};

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    created: "Создан",
    confirmed: "Подтверждён",
    used: "Использован",
    expired: "Истёк",
    cancelled: "Отменён",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "created" || status === "confirmed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "used") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "expired" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function getStudentName(result: ValidationResult): string {
  return (
    result.student?.displayName ||
    `${result.student?.firstName ?? ""} ${result.student?.lastName ?? ""}`.trim() ||
    "—"
  );
}

function getLocationText(result: ValidationResult): string {
  return (
    [result.location?.city, result.location?.address].filter(Boolean).join(", ") ||
    "—"
  );
}

function formatDiscount(result: ValidationResult): string {
  const type = result.offer?.discountType;
  const value = result.offer?.discountValue;

  if (!value) {
    return "—";
  }

  if (type === "percent") {
    return `-${Number(value).toFixed(0)}%`;
  }

  if (type === "fixed_amount") {
    return `-${Number(value).toFixed(0)} ₸`;
  }

  return String(value);
}

function isConfirmDisabled(result: ValidationResult | null): boolean {
  if (!result) {
    return true;
  }

  return (
    result.status === "used" ||
    result.status === "cancelled" ||
    result.status === "expired"
  );
}

function isCancelDisabled(result: ValidationResult | null): boolean {
  if (!result) {
    return true;
  }

  return result.status === "used" || result.status === "cancelled";
}

function InfoTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl bg-[#F9FAF8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-1 break-words font-black text-[#17384B]">{value}</p>

      {hint && <p className="mt-1 text-sm leading-6 text-[#6B7280]">{hint}</p>}
    </div>
  );
}

export default function StaffQrCheckPage(): JSX.Element {
  const trpcClient = useTRPCClient();

  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedToken = useMemo(() => qrToken.trim(), [qrToken]);

  async function validateQr(): Promise<void> {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    setResult(null);

    try {
      const response = await trpcClient.redemptions.validateByQrToken.query({
        qrToken: normalizedToken,
      });

      setResult(response as ValidationResult);
      setMessage("QR-код найден. Проверьте данные перед подтверждением.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось проверить QR"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmQr(): Promise<void> {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await trpcClient.redemptions.confirmByQrToken.mutate({
        qrToken: normalizedToken,
      });

      setResult(response as ValidationResult);
      setMessage("QR-код подтверждён. Скидка считается использованной.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось подтвердить QR"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelQr(): Promise<void> {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await trpcClient.redemptions.cancelByQrToken.mutate({
        qrToken: normalizedToken,
      });

      setResult(response as ValidationResult);
      setMessage("QR-код отменён.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отменить QR"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function clearForm(): void {
    setQrToken("");
    setResult(null);
    setError(null);
    setMessage(null);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Staff QR
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Проверка QR-кода скидки
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Вставьте QR-токен студента, проверьте данные скидки, студента,
              партнёра и точки продаж, затем подтвердите или отмените
              использование.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/partner/redemptions"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                История QR
              </Link>

              <Link
                href="/partner/staff"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Команда
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{result ? 1 : 0}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Найдено
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {result ? statusLabel(result.status) : "—"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Статус
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{formatDiscount(result ?? ({} as ValidationResult))}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Выгода
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            QR input
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Вставьте токен
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#6B7280]">
            В демо-версии можно вставить QR-токен вручную. Позже сюда можно
            подключить камеру и сканер QR через browser API.
          </p>

          <div className="mt-6 grid gap-4">
            <label>
              <span className="text-sm font-black text-[#17384B]">
                QR-токен *
              </span>

              <textarea
                value={qrToken}
                onChange={(event) => setQrToken(event.target.value)}
                placeholder="Введите или вставьте QR-токен"
                rows={5}
                className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 font-mono text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void validateQr()}
                disabled={isLoading || normalizedToken.length === 0}
                className="rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Проверяем..." : "Проверить QR"}
              </button>

              <button
                type="button"
                onClick={clearForm}
                className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
              >
                Очистить
              </button>
            </div>

            {message && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="ub-animate-fade-up ub-delay-100 ub-card rounded-[34px] p-6 md:p-7">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Validation result
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Результат проверки
          </h2>

          {!result ? (
            <div className="mt-6 rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-xl font-black text-[#FF7F6E]">
                QR
              </div>

              <h3 className="mt-5 text-xl font-black text-[#17384B]">
                QR ещё не проверен
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6B7280]">
                Вставьте токен слева и нажмите “Проверить QR”, чтобы увидеть
                данные скидки и студента.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <div className="flex flex-col gap-3 rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#6B7280]">
                    Статус redemption
                  </p>

                  <p className="mt-1 text-3xl font-black text-[#17384B]">
                    {statusLabel(result.status)}
                  </p>
                </div>

                <span
                  className={[
                    "w-fit rounded-2xl border px-3 py-1 text-xs font-black",
                    statusClass(result.status),
                  ].join(" ")}
                >
                  {result.status}
                </span>
              </div>

              <div className="rounded-2xl bg-[#0F172A] p-4 font-mono text-xs leading-6 text-white">
                {result.qrToken}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <InfoTile
                  label="Скидка"
                  value={result.offer?.title ?? "—"}
                  hint={result.offer?.shortDescription ?? "Описание не указано"}
                />

                <InfoTile
                  label="Выгода"
                  value={formatDiscount(result)}
                  hint={`${result.offer?.discountType ?? "тип не указан"}`}
                />

                <InfoTile
                  label="Студент"
                  value={getStudentName(result)}
                  hint={result.student?.email ?? "email не указан"}
                />

                <InfoTile
                  label="Статус студента"
                  value={result.student?.status ?? "—"}
                />

                <InfoTile
                  label="Партнёр"
                  value={result.partner?.brandName ?? "—"}
                />

                <InfoTile
                  label="Точка"
                  value={result.location?.name ?? "—"}
                  hint={getLocationText(result)}
                />

                <InfoTile
                  label="Истекает"
                  value={formatDateTime(result.qrExpiresAt)}
                />

                <InfoTile
                  label="Использован"
                  value={formatDateTime(result.usedAt)}
                />

                <InfoTile
                  label="Отменён"
                  value={formatDateTime(result.cancelledAt)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void confirmQr()}
                  disabled={isLoading || isConfirmDisabled(result)}
                  className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Подтверждаем..." : "Подтвердить использование"}
                </button>

                <button
                  type="button"
                  onClick={() => void cancelQr()}
                  disabled={isLoading || isCancelDisabled(result)}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Отменяем..." : "Отменить QR"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}