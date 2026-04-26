"use client";

import Link from "next/link";
import { type JSX, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

function QueueCard({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count: number;
  href: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#17384B]">{title}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Ожидает: {count}</p>
        </div>
        <Link
          href={href}
          className="rounded-2xl bg-[#FF9F8A] px-4 py-2 text-sm font-bold text-white"
        >
          Открыть
        </Link>
      </div>

      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

export default function AdminModerationPage(): JSX.Element {
  const trpc = useTRPC();
  const queueQuery = useQuery(
    trpc.business.admin.getModerationQueue.queryOptions()
  );

  const data = queueQuery.data;

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Moderation
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Центр модерации
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Единое место для pending-заявок: партнёры, офферы и студенческие
          верификации.
        </p>
      </section>

      {queueQuery.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить очередь: {queueQuery.error.message}
        </div>
      )}

      {queueQuery.isLoading ? (
        <div className="mt-6 rounded-[28px] bg-white p-6 text-[#6B7280]">
          Загружаем очередь модерации...
        </div>
      ) : (
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <QueueCard
            title="Партнёры"
            count={data?.counts.pendingPartners ?? 0}
            href="/admin/partners"
          >
            {(data?.pendingPartners ?? []).length === 0 ? (
              <p className="text-sm text-[#6B7280]">Нет pending-партнёров.</p>
            ) : (
              (data?.pendingPartners ?? []).map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-2xl border border-[#E5ECE9] p-4"
                >
                  <p className="font-bold text-[#17384B]">
                    {partner.brandName}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {partner.legalName} · {partner.contactEmail}
                  </p>
                </div>
              ))
            )}
          </QueueCard>

          <QueueCard
            title="Офферы"
            count={data?.counts.pendingOffers ?? 0}
            href="/admin/offers"
          >
            {(data?.pendingOffers ?? []).length === 0 ? (
              <p className="text-sm text-[#6B7280]">Нет pending-офферов.</p>
            ) : (
              (data?.pendingOffers ?? []).map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-[#E5ECE9] p-4"
                >
                  <p className="font-bold text-[#17384B]">{offer.title}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {offer.partner?.brandName ?? "—"} · {offer.status}
                  </p>
                </div>
              ))
            )}
          </QueueCard>

          <QueueCard
            title="Студенты"
            count={data?.counts.pendingVerifications ?? 0}
            href="/admin/verifications"
          >
            {(data?.pendingVerifications ?? []).length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                Нет pending-верификаций.
              </p>
            ) : (
              (data?.pendingVerifications ?? []).map((verification) => (
                <div
                  key={verification.id}
                  className="rounded-2xl border border-[#E5ECE9] p-4"
                >
                  <p className="font-bold text-[#17384B]">
                    {verification.user?.email ?? verification.submittedEmail}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {verification.method} · {verification.status}
                  </p>
                </div>
              ))
            )}
          </QueueCard>
        </section>
      )}
    </div>
  );
}
