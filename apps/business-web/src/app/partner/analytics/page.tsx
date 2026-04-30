"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type PartnerAnalyticsData = {
  metrics: {
    totalRedemptions: number;
    usedRedemptions: number;
    totalOrderAmount: number;
    totalDiscountAmount: number;
  };
  topOffers: Array<{
    id: string;
    title: string;
    totalRedemptions: number;
    usedRedemptions: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
};

function formatMoney(value?: number | null): string {
  const safeValue = Number(value ?? 0);

  if (!Number.isFinite(safeValue)) {
    return "0 ₸";
  }

  return `${Math.round(safeValue)} ₸`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

function getRate(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (part / total) * 100;
}

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

function LoadingAnalytics(): JSX.Element {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="ub-card rounded-[30px] p-5">
            <div className="ub-skeleton h-4 w-28 rounded-full" />
            <div className="ub-skeleton mt-5 h-10 w-24 rounded-full" />
            <div className="ub-skeleton mt-4 h-4 w-36 rounded-full" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="ub-card rounded-[34px] p-6">
            <div className="ub-skeleton h-6 w-40 rounded-full" />
            <div className="mt-5 grid gap-3">
              <div className="ub-skeleton h-14 rounded-2xl" />
              <div className="ub-skeleton h-14 rounded-2xl" />
              <div className="ub-skeleton h-14 rounded-2xl" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  rate,
  index,
}: {
  label: string;
  value: string | number;
  hint: string;
  rate: number;
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

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/14">
        <div
          className="h-full rounded-full bg-[#FFB5A4]"
          style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
        />
      </div>
    </article>
  );
}

function TopOffersCard({
  offers,
  totalRedemptions,
}: {
  offers: PartnerAnalyticsData["topOffers"];
  totalRedemptions: number;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Top offers
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Лучшие скидки
          </h2>
        </div>

        <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
          {offers.length}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {offers.length === 0 ? (
          <div className="rounded-[24px] bg-[#F9FAF8] p-5 text-sm leading-7 text-[#6B7280]">
            Пока нет данных. Когда студенты начнут получать QR-коды, здесь
            появятся самые популярные скидки.
          </div>
        ) : (
          offers.map((offer, index) => {
            const usedRate = getRate(
              offer.usedRedemptions,
              offer.totalRedemptions
            );

            const shareRate = getRate(offer.totalRedemptions, totalRedemptions);

            return (
              <article
                key={offer.id}
                className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#17384B] text-xs font-black text-white">
                        {index + 1}
                      </span>

                      <p className="line-clamp-1 font-black text-[#17384B]">
                        {offer.title}
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                      QR:{" "}
                      <span className="font-black text-[#17384B]">
                        {offer.totalRedemptions}
                      </span>{" "}
                      · Used:{" "}
                      <span className="font-black text-[#17384B]">
                        {offer.usedRedemptions}
                      </span>{" "}
                      · Conversion:{" "}
                      <span className="font-black text-[#FF7F6E]">
                        {formatPercent(usedRate)}
                      </span>
                    </p>
                  </div>

                  <span className="w-fit shrink-0 rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
                    share {formatPercent(shareRate)}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F7F6F1]">
                  <div
                    className="h-full rounded-full bg-[#FF9F8A]"
                    style={{
                      width: `${Math.min(Math.max(shareRate, 0), 100)}%`,
                    }}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatusBreakdownCard({
  items,
}: {
  items: PartnerAnalyticsData["statusBreakdown"];
}): JSX.Element {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="ub-card rounded-[34px] p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            QR Status
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Разбивка по статусам
          </h2>
        </div>

        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
          {total}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-[24px] bg-[#F9FAF8] p-5 text-sm leading-7 text-[#6B7280]">
            Статистика по статусам пока недоступна.
          </div>
        ) : (
          items.map((item) => {
            const rate = getRate(item.count, total);

            return (
              <article
                key={item.status}
                className="rounded-[24px] border border-[#E5ECE9] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={[
                      "rounded-2xl border px-3 py-1 text-xs font-black",
                      statusClass(item.status),
                    ].join(" ")}
                  >
                    {statusLabel(item.status)}
                  </span>

                  <div className="text-right">
                    <p className="text-lg font-black text-[#17384B]">
                      {item.count}
                    </p>
                    <p className="text-xs font-bold text-[#9CA3AF]">
                      {formatPercent(rate)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F7F6F1]">
                  <div
                    className="h-full rounded-full bg-[#FF9F8A]"
                    style={{
                      width: `${Math.min(Math.max(rate, 0), 100)}%`,
                    }}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function InsightCard({
  usedRate,
  averageDiscount,
  totalRedemptions,
}: {
  usedRate: number;
  averageDiscount: number;
  totalRedemptions: number;
}): JSX.Element {
  return (
    <section className="rounded-[34px] border border-[#E5ECE9] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF7F4_100%)] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)] md:p-7">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
        Business insights
      </p>

      <h2 className="mt-1 text-2xl font-black text-[#17384B]">
        Краткие выводы
      </h2>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-black text-[#17384B]">
            Конверсия QR: {formatPercent(usedRate)}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Показывает, какая доля созданных QR-кодов дошла до фактического
            использования.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-black text-[#17384B]">
            Средняя скидка: {formatMoney(averageDiscount)}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Рассчитано как общая сумма скидок, делённая на количество QR.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-black text-[#17384B]">
            Активность: {totalRedemptions > 0 ? "есть данные" : "нет данных"}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Для роста показателей стоит опубликовать больше офферов и добавить
            понятные условия для студентов.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function PartnerAnalyticsPage(): JSX.Element {
  const trpc = useTRPC();

  const analyticsQuery = useQuery({
    ...trpc.business.partner.getAnalytics.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const data = analyticsQuery.data as PartnerAnalyticsData | undefined;

  const totalRedemptions = data?.metrics.totalRedemptions ?? 0;
  const usedRedemptions = data?.metrics.usedRedemptions ?? 0;
  const totalOrderAmount = data?.metrics.totalOrderAmount ?? 0;
  const totalDiscountAmount = data?.metrics.totalDiscountAmount ?? 0;

  const usedRate = getRate(usedRedemptions, totalRedemptions);
  const averageDiscount =
    totalRedemptions > 0 ? totalDiscountAmount / totalRedemptions : 0;
  const discountToOrderRate = getRate(totalDiscountAmount, totalOrderAmount);

  const metrics = [
    {
      label: "Всего QR",
      value: totalRedemptions,
      hint: "все redemptions партнёра",
      rate: 100,
    },
    {
      label: "Использовано",
      value: usedRedemptions,
      hint: `conversion ${formatPercent(usedRate)}`,
      rate: usedRate,
    },
    {
      label: "Сумма заказов",
      value: formatMoney(totalOrderAmount),
      hint: "по использованным QR",
      rate: totalOrderAmount > 0 ? 100 : 0,
    },
    {
      label: "Сумма скидок",
      value: formatMoney(totalDiscountAmount),
      hint: `${formatPercent(discountToOrderRate)} от суммы заказов`,
      rate: discountToOrderRate,
    },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Partner / Analytics
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Аналитика партнёра
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Смотрите эффективность скидок: QR-redemptions, использованные
              коды, сумму заказов, сумму скидок и лучшие офферы партнёра.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/partner/offers"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Управлять скидками
              </Link>

              <Link
                href="/partner/redemptions"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                История QR
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
              QR Conversion
            </p>

            <p className="mt-2 text-5xl font-black">
              {formatPercent(usedRate)}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#DDE8EA]">
              Доля использованных QR среди всех созданных кодов.
            </p>
          </div>
        </div>
      </section>

      {analyticsQuery.error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить аналитику: {analyticsQuery.error.message}
        </div>
      )}

      {analyticsQuery.isLoading && !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item, index) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                rate={item.rate}
                index={index}
              />
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <TopOffersCard
              offers={data?.topOffers ?? []}
              totalRedemptions={totalRedemptions}
            />

            <div className="grid gap-4">
              <StatusBreakdownCard items={data?.statusBreakdown ?? []} />

              <InsightCard
                usedRate={usedRate}
                averageDiscount={averageDiscount}
                totalRedemptions={totalRedemptions}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}