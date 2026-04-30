"use client";

import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type AnalyticsData = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalPartners: number;
    approvedPartners: number;
    totalOffers: number;
    publishedOffers: number;
    totalRedemptions: number;
    usedRedemptions: number;
  };
  partnerStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  offerStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  redemptionStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  recentOffers: Array<{
    id: string;
    title: string;
    status: string;
    partner?: {
      brandName?: string | null;
    } | null;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    actorRole?: string | null;
    createdAt: Date | string;
  }>;
};

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
    active: "Активен",
    blocked: "Заблокирован",
    disabled: "Отключён",
    pending: "Ожидает",
    pending_review: "На модерации",
    approved: "Одобрен",
    rejected: "Отклонён",
    suspended: "Заблокирован",
    archived: "Архив",
    draft: "Черновик",
    published: "Опубликован",
    created: "Создан",
    confirmed: "Подтверждён",
    used: "Использован",
    expired: "Истёк",
    cancelled: "Отменён",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (
    status === "active" ||
    status === "approved" ||
    status === "published" ||
    status === "used" ||
    status === "confirmed"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    status === "pending" ||
    status === "pending_review" ||
    status === "draft" ||
    status === "created"
  ) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (
    status === "rejected" ||
    status === "suspended" ||
    status === "archived" ||
    status === "blocked" ||
    status === "disabled" ||
    status === "expired" ||
    status === "cancelled"
  ) {
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

      <section className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="ub-card rounded-[30px] p-6">
            <div className="ub-skeleton h-6 w-40 rounded-full" />
            <div className="mt-5 grid gap-3">
              <div className="ub-skeleton h-12 rounded-2xl" />
              <div className="ub-skeleton h-12 rounded-2xl" />
              <div className="ub-skeleton h-12 rounded-2xl" />
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
  value: number;
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

function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ status: string; count: number }>;
}): JSX.Element {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="ub-card rounded-[34px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Breakdown
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">{title}</h2>
        </div>

        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
          {total}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#F9FAF8] p-4 text-sm text-[#6B7280]">
            Данных пока нет.
          </div>
        ) : (
          items.map((item) => {
            const rate = getRate(item.count, total);

            return (
              <div
                key={item.status}
                className="rounded-[22px] border border-[#E5ECE9] bg-white p-4"
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

                  <span className="text-lg font-black text-[#17384B]">
                    {item.count}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F7F6F1]">
                  <div
                    className="h-full rounded-full bg-[#FF9F8A]"
                    style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function RecentOffersCard({
  offers,
}: {
  offers: AnalyticsData["recentOffers"];
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Offers
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Последние офферы
          </h2>
        </div>

        <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
          {offers.length}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {offers.length === 0 ? (
          <div className="rounded-2xl bg-[#F9FAF8] p-4 text-sm text-[#6B7280]">
            Последних офферов пока нет.
          </div>
        ) : (
          offers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-[22px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="line-clamp-1 font-black text-[#17384B]">
                    {offer.title}
                  </p>

                  <p className="mt-1 text-sm text-[#6B7280]">
                    {offer.partner?.brandName ?? "Партнёр не указан"}
                  </p>
                </div>

                <span
                  className={[
                    "w-fit shrink-0 rounded-2xl border px-3 py-1 text-xs font-black",
                    statusClass(offer.status),
                  ].join(" ")}
                >
                  {statusLabel(offer.status)}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function RecentAuditCard({
  logs,
}: {
  logs: AnalyticsData["recentAuditLogs"];
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Audit
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Последний аудит
          </h2>
        </div>

        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
          {logs.length}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {logs.length === 0 ? (
          <div className="rounded-2xl bg-[#F9FAF8] p-4 text-sm text-[#6B7280]">
            Событий аудита пока нет.
          </div>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[22px] border border-[#E5ECE9] bg-white p-4"
            >
              <p className="font-black text-[#17384B]">{log.action}</p>

              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                {log.entityType} · {log.actorRole ?? "system"}
              </p>

              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
                {new Date(log.createdAt).toLocaleString("ru-RU")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default function AdminAnalyticsPage(): JSX.Element {
  const trpc = useTRPC();

  const analyticsQuery = useQuery({
    ...trpc.business.admin.getAdminAnalytics.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const data = analyticsQuery.data as AnalyticsData | undefined;

  const userActiveRate = getRate(
    data?.metrics.activeUsers ?? 0,
    data?.metrics.totalUsers ?? 0
  );

  const partnerApprovedRate = getRate(
    data?.metrics.approvedPartners ?? 0,
    data?.metrics.totalPartners ?? 0
  );

  const offerPublishedRate = getRate(
    data?.metrics.publishedOffers ?? 0,
    data?.metrics.totalOffers ?? 0
  );

  const redemptionUsedRate = getRate(
    data?.metrics.usedRedemptions ?? 0,
    data?.metrics.totalRedemptions ?? 0
  );

  const metrics = [
    {
      label: "Пользователи",
      value: data?.metrics.totalUsers ?? 0,
      hint: `${data?.metrics.activeUsers ?? 0} active · ${formatPercent(userActiveRate)}`,
      rate: userActiveRate,
    },
    {
      label: "Партнёры",
      value: data?.metrics.totalPartners ?? 0,
      hint: `${data?.metrics.approvedPartners ?? 0} approved · ${formatPercent(
        partnerApprovedRate
      )}`,
      rate: partnerApprovedRate,
    },
    {
      label: "Офферы",
      value: data?.metrics.totalOffers ?? 0,
      hint: `${data?.metrics.publishedOffers ?? 0} published · ${formatPercent(
        offerPublishedRate
      )}`,
      rate: offerPublishedRate,
    },
    {
      label: "QR",
      value: data?.metrics.totalRedemptions ?? 0,
      hint: `${data?.metrics.usedRedemptions ?? 0} used · ${formatPercent(
        redemptionUsedRate
      )}`,
      rate: redemptionUsedRate,
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
              Admin / Analytics
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Аналитика платформы
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Сводка по пользователям, партнёрам, скидкам, QR-redemptions и
              audit-событиям. Эта страница показывает состояние системы для
              админа и подходит для демонстрации комиссии.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
              Conversion
            </p>

            <p className="mt-2 text-4xl font-black">
              {formatPercent(redemptionUsedRate)}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#DDE8EA]">
              Доля использованных QR среди всех созданных redemptions.
            </p>
          </div>
        </div>
      </section>

      {analyticsQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить аналитику: {analyticsQuery.error.message}
        </div>
      )}

      {analyticsQuery.isLoading && !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
                rate={metric.rate}
                index={index}
              />
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <BreakdownCard
              title="Статусы партнёров"
              items={data?.partnerStatusBreakdown ?? []}
            />

            <BreakdownCard
              title="Статусы офферов"
              items={data?.offerStatusBreakdown ?? []}
            />

            <BreakdownCard
              title="Статусы QR"
              items={data?.redemptionStatusBreakdown ?? []}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <RecentOffersCard offers={data?.recentOffers ?? []} />
            <RecentAuditCard logs={data?.recentAuditLogs ?? []} />
          </section>
        </>
      )}
    </div>
  );
}