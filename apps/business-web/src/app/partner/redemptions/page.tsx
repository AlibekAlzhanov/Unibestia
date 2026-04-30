"use client";

import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type RedemptionStatus =
  | "created"
  | "confirmed"
  | "used"
  | "expired"
  | "cancelled"
  | string;

type RedemptionItem = {
  id: string;
  status: RedemptionStatus;
  qrToken: string;
  orderAmount?: string | number | null;
  discountAmount?: string | number | null;
  createdAt?: Date | string | null;
  usedAt?: Date | string | null;
  qrExpiresAt?: Date | string | null;
  offer?: {
    id?: string;
    title?: string | null;
    slug?: string | null;
  } | null;
  student?: {
    id?: string;
    email?: string | null;
    displayName?: string | null;
  } | null;
  location?: {
    id?: string;
    name?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
};

type StatusFilter = "all" | "active" | "used" | "expired";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
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

function isActiveRedemption(item: RedemptionItem): boolean {
  return item.status === "created" || item.status === "confirmed";
}

function isExpiredRedemption(item: RedemptionItem): boolean {
  return item.status === "expired" || item.status === "cancelled";
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function formatMoney(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  return `${Math.round(numberValue)} ₸`;
}

function getLocationText(item: RedemptionItem): string {
  return [item.location?.city, item.location?.address]
    .filter(Boolean)
    .join(", ");
}

function filterByStatus(
  items: RedemptionItem[],
  statusFilter: StatusFilter
): RedemptionItem[] {
  if (statusFilter === "active") {
    return items.filter((item) => isActiveRedemption(item));
  }

  if (statusFilter === "used") {
    return items.filter((item) => item.status === "used");
  }

  if (statusFilter === "expired") {
    return items.filter((item) => isExpiredRedemption(item));
  }

  return items;
}

function LoadingRedemptions(): JSX.Element {
  return (
    <section className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="ub-skeleton h-7 w-32 rounded-full" />
              <div className="ub-skeleton mt-5 h-6 w-2/3 rounded-full" />
              <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
            </div>

            <div className="grid gap-3">
              <div className="ub-skeleton h-12 rounded-2xl" />
              <div className="ub-skeleton h-12 rounded-2xl" />
              <div className="ub-skeleton h-12 rounded-2xl" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function EmptyRedemptions({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        QR
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Использований пока нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilters
          ? "По выбранным фильтрам QR-использований нет. Сбрось фильтр или измени поиск."
          : "Когда студенты начнут получать и показывать QR-коды, история появится здесь."}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
          >
            Сбросить фильтры
          </button>
        )}

        <Link
          href="/partner/offers"
          className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Открыть скидки
        </Link>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: number;
  hint: string;
  index: number;
}): JSX.Element {
  return (
    <article
      className={[
        "ub-animate-fade-up rounded-[30px] border border-white/15 bg-[linear-gradient(135deg,#17384B_0%,#255B73_70%,#FF9F8A_150%)] p-5 text-white shadow-[0_18px_42px_rgba(23,56,75,0.16)]",
        index === 1 ? "ub-delay-100" : "",
        index === 2 ? "ub-delay-200" : "",
        index === 3 ? "ub-delay-300" : "",
      ].join(" ")}
    >
      <p className="text-sm font-bold text-[#DDE8EA]">{label}</p>

      <p className="mt-3 text-4xl font-black tracking-[-0.04em]">{value}</p>

      <p className="mt-3 text-sm font-semibold text-[#FFB5A4]">{hint}</p>
    </article>
  );
}

function RedemptionCard({ item }: { item: RedemptionItem }): JSX.Element {
  const locationText = getLocationText(item);

  return (
    <article className="ub-card rounded-[30px] p-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                statusClass(item.status),
              ].join(" ")}
            >
              {statusLabel(item.status)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              ID: {item.id.slice(0, 8)}
            </span>

            {isActiveRedemption(item) && (
              <span className="rounded-2xl bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                можно показать
              </span>
            )}
          </div>

          <h2 className="mt-5 text-2xl font-black leading-tight text-[#17384B]">
            {item.offer?.title ?? "Скидка"}
          </h2>

          <p className="mt-2 break-all font-mono text-xs font-bold text-[#9CA3AF]">
            {item.qrToken}
          </p>

          <div className="mt-5 grid gap-3 text-sm text-[#6B7280] md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Студент
              </p>

              <p className="mt-1 break-all font-bold text-[#17384B]">
                {item.student?.displayName ?? item.student?.email ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Точка
              </p>

              <p className="mt-1 font-bold text-[#17384B]">
                {item.location?.name ?? "—"}
              </p>

              {locationText && (
                <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                  {locationText}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Order amount
              </p>

              <p className="mt-1 text-xl font-black text-[#17384B]">
                {formatMoney(item.orderAmount)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Discount
              </p>

              <p className="mt-1 text-xl font-black text-[#FF7F6E]">
                {formatMoney(item.discountAmount)}
              </p>
            </div>
          </div>
        </div>

        <aside className="grid gap-3">
          <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-4">
            <p className="text-sm font-black text-[#17384B]">
              Время операции
            </p>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="font-bold text-[#526470]">Создан</span>
                <span className="text-right font-black text-[#17384B]">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="font-bold text-[#526470]">Истекает</span>
                <span className="text-right font-black text-[#17384B]">
                  {formatDateTime(item.qrExpiresAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="font-bold text-[#526470]">Использован</span>
                <span className="text-right font-black text-[#17384B]">
                  {formatDateTime(item.usedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#FFE0D8] bg-[#FFF7F4] p-4 text-sm leading-6 text-[#8A4B3F]">
            QR-redemption показывает, что студент получил или использовал
            скидку. Для фактического списания сотрудник должен подтвердить QR в
            staff-разделе.
          </div>

          {item.offer?.slug && (
            <Link
              href={`/partner/offers/${item.offer.id ?? item.offer.slug}`}
              className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
            >
              Открыть оффер →
            </Link>
          )}
        </aside>
      </div>
    </article>
  );
}

export default function PartnerRedemptionsPage(): JSX.Element {
  const trpc = useTRPC();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const redemptionsQuery = useQuery({
    ...trpc.business.partner.listRedemptions.queryOptions({
      limit: 50,
      offset: 0,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const items = useMemo(
    () => (redemptionsQuery.data?.items ?? []) as RedemptionItem[],
    [redemptionsQuery.data?.items]
  );

  const filteredItems = useMemo(() => {
    const byStatus = filterByStatus(items, statusFilter);
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return byStatus;
    }

    return byStatus.filter((item) => {
      const searchable = [
        item.id,
        item.qrToken,
        item.status,
        item.offer?.title,
        item.student?.email,
        item.student?.displayName,
        item.location?.name,
        item.location?.city,
        item.location?.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [items, statusFilter, search]);

  const totalCount = items.length;
  const activeCount = items.filter((item) => isActiveRedemption(item)).length;
  const usedCount = items.filter((item) => item.status === "used").length;
  const expiredCount = items.filter((item) => isExpiredRedemption(item)).length;

  const totalDiscount = items.reduce((sum, item) => {
    const value = Number(item.discountAmount ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  const hasFilters = statusFilter !== "all" || search.trim().length > 0;

  function resetFilters(): void {
    setStatusFilter("all");
    setSearch("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Partner / Redemptions
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              История QR-использований
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Отслеживайте созданные, подтверждённые, использованные и истёкшие
              QR-коды. Здесь видно, какие студенты использовали скидки и в каких
              точках продаж.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/staff"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Проверить QR
              </Link>

              <Link
                href="/partner/offers"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Скидки партнёра
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{usedCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Used
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{formatMoney(totalDiscount)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Discount
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Всего QR"
          value={totalCount}
          hint="все созданные redemptions"
          index={0}
        />

        <MetricCard
          label="Активные"
          value={activeCount}
          hint="можно показать сотруднику"
          index={1}
        />

        <MetricCard
          label="Использовано"
          value={usedCount}
          hint="подтверждённые операции"
          index={2}
        />

        <MetricCard
          label="Истёкшие"
          value={expiredCount}
          hint="expired или cancelled"
          index={3}
        />
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр истории
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Показано: {filteredItems.length} из {items.length}
            </h2>
          </div>

          <label className="w-full lg:w-[360px]">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Поиск
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="QR token, студент, скидка, точка..."
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
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

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#17384B] transition hover:bg-white"
            >
              Сбросить
            </button>
          )}
        </div>
      </section>

      {redemptionsQuery.error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить использования: {redemptionsQuery.error.message}
        </div>
      )}

      {redemptionsQuery.isLoading && !redemptionsQuery.data ? (
        <LoadingRedemptions />
      ) : filteredItems.length === 0 ? (
        <EmptyRedemptions hasFilters={hasFilters} onReset={resetFilters} />
      ) : (
        <section className="grid gap-4">
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
        </section>
      )}
    </div>
  );
}