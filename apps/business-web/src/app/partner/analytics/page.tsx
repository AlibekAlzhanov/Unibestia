"use client";

import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export default function PartnerAnalyticsPage(): JSX.Element {
  const trpc = useTRPC();
  const analyticsQuery = useQuery(
    trpc.business.partner.getAnalytics.queryOptions()
  );

  const data = analyticsQuery.data;

  const analytics = [
    {
      label: "Всего QR",
      value: data?.metrics.totalRedemptions ?? 0,
    },
    {
      label: "Использовано",
      value: data?.metrics.usedRedemptions ?? 0,
    },
    {
      label: "Сумма заказов",
      value: `${Math.round(data?.metrics.totalOrderAmount ?? 0)} ₸`,
    },
    {
      label: "Сумма скидок",
      value: `${Math.round(data?.metrics.totalDiscountAmount ?? 0)} ₸`,
    },
  ];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Analytics
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Аналитика партнёра
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Первые реальные агрегаты по QR-redemptions и офферам.
        </p>
      </section>

      {analyticsQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить аналитику: {analyticsQuery.error.message}
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] bg-[#17384B] p-5 text-white"
          >
            <p className="text-sm text-[#DDE8EA]">{item.label}</p>
            <p className="mt-3 text-3xl font-black">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-[#17384B]">Top offers</h2>
          <div className="mt-4 space-y-3">
            {(data?.topOffers ?? []).length === 0 ? (
              <p className="text-sm text-[#6B7280]">Нет данных.</p>
            ) : (
              data?.topOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-[#E5ECE9] p-4"
                >
                  <p className="font-bold text-[#17384B]">{offer.title}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    QR: {offer.totalRedemptions} · Used:{" "}
                    {offer.usedRedemptions}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-[#17384B]">Status breakdown</h2>
          <div className="mt-4 space-y-3">
            {(data?.statusBreakdown ?? []).map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between rounded-2xl border border-[#E5ECE9] p-4"
              >
                <span className="font-bold text-[#17384B]">{item.status}</span>
                <span className="rounded-xl bg-[#F7F6F1] px-3 py-1 text-sm font-black text-[#526470]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
