"use client";

import Image from "next/image";
import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type RedemptionStatus = "created" | "confirmed" | "used" | "expired" | "cancelled" | string;

type RedemptionItem = {
  id: string;
  status: RedemptionStatus;
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

type FilterMode = "all" | "active" | "used" | "expired";

const statusFilters: Array<{ value: FilterMode; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "used", label: "Использованные" },
  { value: "expired", label: "Истёкшие" },
];

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

function qrImageUrl(qrToken: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    qrToken
  )}`;
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "не указано";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function isActiveRedemption(item: RedemptionItem): boolean {
  return item.status === "created" || item.status === "confirmed";
}

function filterRedemptions(
  items: RedemptionItem[],
  filterMode: FilterMode
): RedemptionItem[] {
  if (filterMode === "active") {
    return items.filter((item) => isActiveRedemption(item));
  }

  if (filterMode === "used") {
    return items.filter((item) => item.status === "used");
  }

  if (filterMode === "expired") {
    return items.filter(
      (item) => item.status === "expired" || item.status === "cancelled"
    );
  }

  return items;
}

function LoadingRedemptions(): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="ub-card rounded-[30px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="ub-skeleton h-4 w-32 rounded-full" />
              <div className="ub-skeleton mt-3 h-6 w-4/5 rounded-full" />
              <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
            </div>
            <div className="ub-skeleton h-8 w-24 rounded-2xl" />
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-[24px] bg-[#F9FAF8] p-4 md:flex-row md:items-center">
            <div className="ub-skeleton h-[160px] w-[160px] rounded-2xl" />
            <div className="flex-1">
              <div className="ub-skeleton h-4 w-24 rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-full rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-2/3 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRedemptions({
  hasFilter,
  onReset,
}: {
  hasFilter: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <div className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        QR
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        {hasFilter ? "По этому фильтру ничего нет" : "Пока нет полученных скидок"}
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilter
          ? "Попробуй выбрать другой статус или открой полный список QR-кодов."
          : "Открой каталог, выбери скидку и нажми “Получить QR”. После этого она появится здесь."}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
          >
            Показать все
          </button>
        )}

        <Link
          href="/catalog"
          className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Перейти в каталог
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-red-700">
      <p className="text-sm font-black uppercase tracking-[0.14em]">
        Ошибка загрузки
      </p>

      <p className="mt-2 text-sm leading-6">
        Не удалось загрузить QR-коды: {message}
      </p>

      <p className="mt-2 text-sm leading-6">
        Если ошибка связана с Application user not found, нужно связать текущий
        Clerk-аккаунт с пользователем в таблице users.
      </p>
    </div>
  );
}

function RedemptionCard({ item }: { item: RedemptionItem }): JSX.Element {
  const locationText = [item.location?.city, item.location?.address]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#9CA3AF]">
            {item.location?.name ?? "Локация не указана"}
          </p>

          <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-[#17384B]">
            {item.offer?.title ?? "Скидка"}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6B7280]">
            {item.offer?.shortDescription ?? "Описание недоступно."}
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-2xl border px-3 py-2 text-sm font-black",
            statusClass(item.status),
          ].join(" ")}
        >
          {statusLabel(item.status)}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-[26px] bg-[#F9FAF8] p-4 md:flex-row md:items-center">
        <Image
          src={qrImageUrl(item.qrToken)}
          alt="QR code"
          width={180}
          height={180}
          sizes="180px"
          className="mx-auto h-[180px] w-[180px] rounded-[24px] bg-white p-3 shadow-[0_12px_26px_rgba(15,23,42,0.06)] md:mx-0"
        />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9CA3AF]">
            QR token
          </p>

          <p className="mt-2 break-all rounded-2xl bg-white px-3 py-2 font-mono text-xs font-bold text-[#526470]">
            {item.qrToken}
          </p>

          <div className="mt-3 grid gap-2 text-sm text-[#6B7280]">
            <p>
              Создан:{" "}
              <span className="font-bold text-[#17384B]">
                {formatDateTime(item.createdAt)}
              </span>
            </p>

            <p>
              Истекает:{" "}
              <span className="font-bold text-[#17384B]">
                {formatDateTime(item.qrExpiresAt)}
              </span>
            </p>

            {item.usedAt && (
              <p>
                Использован:{" "}
                <span className="font-bold text-[#17384B]">
                  {formatDateTime(item.usedAt)}
                </span>
              </p>
            )}

            {locationText && <p>{locationText}</p>}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {item.offer?.slug ? (
          <Link
            href={`/offer/${item.offer.slug}`}
            className="text-sm font-black text-[#FF7F6E]"
          >
            Открыть скидку →
          </Link>
        ) : (
          <span className="text-sm font-bold text-[#9CA3AF]">
            Ссылка на скидку недоступна
          </span>
        )}

        {isActiveRedemption(item) && (
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
            Можно показать партнёру
          </span>
        )}
      </div>
    </article>
  );
}

export default function MyRedemptionsPage(): JSX.Element {
  const trpc = useTRPC();
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const redemptionsQuery = useQuery(
    trpc.redemptions.listMine.queryOptions({
      limit: 30,
      offset: 0,
    })
  );

  const items = useMemo(
    () => (redemptionsQuery.data?.items ?? []) as RedemptionItem[],
    [redemptionsQuery.data?.items]
  );

  const filteredItems = useMemo(
    () => filterRedemptions(items, filterMode),
    [items, filterMode]
  );

  const activeCount = items.filter((item) => isActiveRedemption(item)).length;
  const usedCount = items.filter((item) => item.status === "used").length;
  const expiredCount = items.filter(
    (item) => item.status === "expired" || item.status === "cancelled"
  ).length;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Мои скидки
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Полученные QR-коды
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Здесь хранятся QR-коды, которые ты получил на сайте или в
              мобильном приложении. Активный QR можно показать сотруднику
              партнёра.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Активные
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{usedCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Использованы
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{expiredCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Истекли
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              История QR
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {statusFilters.map((filter) => {
              const isActive = filterMode === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setFilterMode(filter.value)}
                  className={[
                    "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                    isActive
                      ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                      : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {redemptionsQuery.isLoading ? (
        <LoadingRedemptions />
      ) : redemptionsQuery.error ? (
        <ErrorState message={redemptionsQuery.error.message} />
      ) : filteredItems.length === 0 ? (
        <EmptyRedemptions
          hasFilter={filterMode !== "all"}
          onReset={() => setFilterMode("all")}
        />
      ) : (
        <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={[
                "ub-animate-fade-up",
                index === 1 ? "ub-delay-100" : "",
                index === 2 ? "ub-delay-200" : "",
              ].join(" ")}
            >
              <RedemptionCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}