"use client";

import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}): JSX.Element {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-bold text-[#6B7280]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#17384B]">{value}</p>
      <p className="mt-2 text-sm text-[#FF7F6E]">{hint}</p>
    </div>
  );
}

export default function AdminAnalyticsPage(): JSX.Element {
  const trpc = useTRPC();
  const analyticsQuery = useQuery(trpc.business.admin.getAdminAnalytics.queryOptions());

  const data = analyticsQuery.data;

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Analytics
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Аналитика платформы
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Сводка по пользователям, партнёрам, скидкам, QR-redemptions и
          последним audit-событиям.
        </p>
      </section>

      {analyticsQuery.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить аналитику: {analyticsQuery.error.message}
        </div>
      )}

      {analyticsQuery.isLoading ? (
        <div className="mt-6 rounded-[28px] bg-white p-6 text-[#6B7280]">
          Загружаем аналитику...
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard
              label="Пользователи"
              value={data?.metrics.totalUsers ?? 0}
              hint={(data?.metrics.activeUsers ?? 0) + " active"}
            />
            <StatCard
              label="Партнёры"
              value={data?.metrics.totalPartners ?? 0}
              hint={(data?.metrics.approvedPartners ?? 0) + " approved"}
            />
            <StatCard
              label="Офферы"
              value={data?.metrics.totalOffers ?? 0}
              hint={(data?.metrics.publishedOffers ?? 0) + " published"}
            />
            <StatCard
              label="QR"
              value={data?.metrics.totalRedemptions ?? 0}
              hint={(data?.metrics.usedRedemptions ?? 0) + " used"}
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Partner statuses
              </h2>
              <div className="mt-4 space-y-3">
                {(data?.partnerStatusBreakdown ?? []).map((item) => (
                  <div key={item.status} className="flex justify-between">
                    <span className="text-sm text-[#6B7280]">{item.status}</span>
                    <span className="font-black text-[#17384B]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Offer statuses
              </h2>
              <div className="mt-4 space-y-3">
                {(data?.offerStatusBreakdown ?? []).map((item) => (
                  <div key={item.status} className="flex justify-between">
                    <span className="text-sm text-[#6B7280]">{item.status}</span>
                    <span className="font-black text-[#17384B]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Redemption statuses
              </h2>
              <div className="mt-4 space-y-3">
                {(data?.redemptionStatusBreakdown ?? []).map((item) => (
                  <div key={item.status} className="flex justify-between">
                    <span className="text-sm text-[#6B7280]">{item.status}</span>
                    <span className="font-black text-[#17384B]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Последние офферы
              </h2>
              <div className="mt-4 space-y-3">
                {(data?.recentOffers ?? []).map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-2xl border border-[#E5ECE9] p-4"
                  >
                    <p className="font-bold text-[#17384B]">{offer.title}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {offer.status} · {offer.partner?.brandName ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Последний аудит
              </h2>
              <div className="mt-4 space-y-3">
                {(data?.recentAuditLogs ?? []).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-[#E5ECE9] p-4"
                  >
                    <p className="font-bold text-[#17384B]">{log.action}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {log.entityType} · {log.actorRole ?? "system"} ·{" "}
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
