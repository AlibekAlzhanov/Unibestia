"use client";

import Image from "next/image";
import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type RedemptionItem = {
  id: string;
  status: string;
  qrToken: string;
  qrExpiresAt?: Date | string | null;
  usedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  createdAt?: Date | string | null;
  offer?: {
    slug?: string | null;
    title?: string | null;
    shortDescription?: string | null;
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

function qrImageUrl(qrToken: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    qrToken
  )}`;
}

export default function MyRedemptionsPage(): JSX.Element {
  const trpc = useTRPC();

  const redemptionsQuery = useQuery(
    trpc.redemptions.listMine.queryOptions({
      limit: 30,
      offset: 0,
    })
  );

  const items = (redemptionsQuery.data?.items ?? []) as RedemptionItem[];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-6 rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Мои скидки
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#17384B]">
          Полученные QR-коды
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Здесь отображаются QR-коды, которые ты получил на сайте или в
          мобильном приложении.
        </p>
      </div>

      {redemptionsQuery.isLoading ? (
        <div className="rounded-3xl bg-white p-8 text-[#6B7280]">
          Загружаем QR-коды...
        </div>
      ) : redemptionsQuery.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
          Не удалось загрузить QR-коды: {redemptionsQuery.error.message}
          <p className="mt-2 text-sm">
            Если ошибка связана с Application user not found, нужно связать
            текущий Clerk-аккаунт с пользователем в таблице users.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-[#6B7280]">
          Пока нет полученных скидок.{" "}
          <Link href="/catalog" className="font-bold text-[#FF7F6E]">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[28px] border border-[#E5ECE9] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#9CA3AF]">
                    {item.location?.name ?? "Локация не указана"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#17384B]">
                    {item.offer?.title ?? "Скидка"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                    {item.offer?.shortDescription ?? "Описание недоступно."}
                  </p>
                </div>
                <span className="rounded-2xl bg-[#F7F6F1] px-3 py-2 text-sm font-bold text-[#17384B]">
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-4 rounded-[24px] bg-[#F9FAF8] p-4 md:flex-row md:items-center">
                <Image
                  src={qrImageUrl(item.qrToken)}
                  alt="QR code"
                  width={160}
                  height={160}
                  sizes="160px"
                  className="h-[160px] w-[160px] rounded-2xl bg-white p-3"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">
                    QR token
                  </p>
                  <p className="mt-2 break-all rounded-2xl bg-white px-3 py-2 font-mono text-xs font-bold text-[#526470]">
                    {item.qrToken}
                  </p>
                  <p className="mt-3 text-sm text-[#6B7280]">
                    Истекает:{" "}
                    {item.qrExpiresAt
                      ? new Date(item.qrExpiresAt).toLocaleString()
                      : "не указано"}
                  </p>
                  {item.usedAt && (
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Использован: {new Date(item.usedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {item.offer?.slug && (
                <Link
                  href={`/offer/${item.offer.slug}`}
                  className="mt-4 inline-flex text-sm font-bold text-[#FF7F6E]"
                >
                  Открыть скидку →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}