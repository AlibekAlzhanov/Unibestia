"use client";

import { type JSX, useState } from "react";
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

export default function StaffQrCheckPage(): JSX.Element {
  const trpcClient = useTRPCClient();
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function validateQr(): Promise<void> {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await trpcClient.redemptions.validateByQrToken.query({
        qrToken: qrToken.trim(),
      });

      setResult(response as ValidationResult);
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

    try {
      const response = await trpcClient.redemptions.confirmByQrToken.mutate({
        qrToken: qrToken.trim(),
      });

      setResult(response as ValidationResult);
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

    try {
      const response = await trpcClient.redemptions.cancelByQrToken.mutate({
        qrToken: qrToken.trim(),
        reason: "Отменено сотрудником через business portal",
      });

      setResult(response as ValidationResult);
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

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[960px] px-4 py-10 md:px-6 lg:px-8">
      <div className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Staff Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#17384B]">
          Проверка QR-кода скидки
        </h1>
        <p className="mt-3 text-[#6B7280]">
          Вставь QR-токен студента. Для теста можно использовать:
          <span className="ml-1 font-mono font-bold text-[#17384B]">
            QR-SEED-ALIBEK-001
          </span>
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={qrToken}
            onChange={(event) => setQrToken(event.target.value)}
            placeholder="QR-SEED-ALIBEK-001"
            className="h-12 flex-1 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none transition focus:border-[#FF9F8A]"
          />
          <button
            type="button"
            onClick={validateQr}
            disabled={isLoading || qrToken.trim().length === 0}
            className="h-12 rounded-2xl bg-[#17384B] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            Проверить
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#6B7280]">Статус redemption</p>
                <p className="text-2xl font-black text-[#17384B]">
                  {result.status}
                </p>
              </div>
              <span className="rounded-2xl bg-white px-4 py-2 font-mono text-xs font-bold text-[#526470]">
                {result.qrToken}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">
                  Скидка
                </p>
                <p className="mt-1 font-bold text-[#17384B]">
                  {result.offer?.title ?? "—"}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {result.offer?.shortDescription ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">
                  Студент
                </p>
                <p className="mt-1 font-bold text-[#17384B]">
                  {result.student?.displayName ||
                    `${result.student?.firstName ?? ""} ${result.student?.lastName ?? ""}`.trim() ||
                    "—"}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {result.student?.email ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">
                  Партнёр
                </p>
                <p className="mt-1 font-bold text-[#17384B]">
                  {result.partner?.brandName ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">
                  Точка
                </p>
                <p className="mt-1 font-bold text-[#17384B]">
                  {result.location?.name ?? "—"}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {[result.location?.city, result.location?.address]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={confirmQr}
                disabled={isLoading || result.status === "used"}
                className="h-12 flex-1 rounded-2xl bg-[#FF9F8A] px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                Подтвердить использование
              </button>
              <button
                type="button"
                onClick={cancelQr}
                disabled={
                  isLoading ||
                  result.status === "used" ||
                  result.status === "cancelled"
                }
                className="h-12 flex-1 rounded-2xl border border-[#D8E3DE] bg-white px-5 text-sm font-bold text-[#17384B] disabled:opacity-50"
              >
                Отменить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
