"use client";

import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export default function PartnerRedemptionsPage(): JSX.Element {
  const trpc = useTRPC();
  const redemptionsQuery = useQuery(
    trpc.business.partner.listRedemptions.queryOptions({
      limit: 50,
      offset: 0,
    })
  );

  const items = redemptionsQuery.data?.items ?? [];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Redemptions
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          История использований
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Реальные QR-redemptions партнёра из PostgreSQL.
        </p>
      </section>

      {redemptionsQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить использования: {redemptionsQuery.error.message}
        </div>
      )}

      <section className="mt-6 grid gap-4">
        {redemptionsQuery.isLoading ? (
          <div className="rounded-3xl bg-white p-6 text-[#6B7280]">
            Загружаем...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-[#6B7280]">
            Использований пока нет.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="font-mono text-xs font-bold text-[#94A3B8]">
                    {item.qrToken}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#17384B]">
                    {item.offer?.title ?? "Скидка"}
                  </h2>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Студент:{" "}
                    {item.student?.displayName ??
                      item.student?.email ??
                      "—"}{" "}
                    · Точка: {item.location?.name ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Сумма: {item.orderAmount ?? "—"} · Скидка:{" "}
                    {item.discountAmount ?? "—"}
                  </p>
                </div>
                <span className="w-fit rounded-2xl bg-[#F7F6F1] px-4 py-2 text-sm font-black text-[#17384B]">
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
