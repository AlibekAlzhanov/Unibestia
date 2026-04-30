"use client";

import Link from "next/link";
import { type JSX, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

function QueueCard({
  title,
  count,
  href,
  badge,
  description,
  children,
}: {
  title: string;
  count: number;
  href: string;
  badge: string;
  description: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="ub-card ub-animate-fade-up rounded-[34px] p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-2xl bg-[#FFF0EB] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#FF7F6E]">
            {badge}
          </span>

          <h2 className="mt-5 text-2xl font-black text-[#17384B]">{title}</h2>

          <p className="mt-2 text-sm leading-7 text-[#6B7280]">
            {description}
          </p>
        </div>

        <div className="shrink-0 rounded-[24px] bg-[#F9FAF8] px-5 py-4 text-center">
          <p className="text-3xl font-black text-[#17384B]">{count}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            pending
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">{children}</div>

      <Link
        href={href}
        className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#255B73]"
      >
        Открыть раздел →
      </Link>
    </section>
  );
}

function EmptyItem({ text }: { text: string }): JSX.Element {
  return (
    <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5 text-sm leading-7 text-[#6B7280]">
      {text}
    </div>
  );
}

function QueueItem({
  title,
  subtitle,
  tag,
}: {
  title: string;
  subtitle: string;
  tag: string;
}): JSX.Element {
  return (
    <article className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="line-clamp-1 font-black text-[#17384B]">{title}</p>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6B7280]">
            {subtitle}
          </p>
        </div>

        <span className="w-fit shrink-0 rounded-2xl border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
          {tag}
        </span>
      </div>
    </article>
  );
}

function LoadingModeration(): JSX.Element {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="ub-card rounded-[34px] p-6">
          <div className="ub-skeleton h-8 w-28 rounded-full" />
          <div className="ub-skeleton mt-5 h-7 w-44 rounded-full" />
          <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-3/4 rounded-full" />

          <div className="mt-6 grid gap-3">
            <div className="ub-skeleton h-20 rounded-2xl" />
            <div className="ub-skeleton h-20 rounded-2xl" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function AdminModerationPage(): JSX.Element {
  const trpc = useTRPC();

  const queueQuery = useQuery({
    ...trpc.business.admin.getModerationQueue.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const data = queueQuery.data;

  const pendingPartners = data?.counts.pendingPartners ?? 0;
  const pendingOffers = data?.counts.pendingOffers ?? 0;
  const pendingVerifications = data?.counts.pendingVerifications ?? 0;
  const totalPending = pendingPartners + pendingOffers + pendingVerifications;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin / Moderation
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Центр модерации
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Единый экран для проверки pending-заявок: партнёры, офферы и
              студенческие PDF-верификации. Этот раздел показывает контрольный
              workflow платформы.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/admin/partners"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Партнёры
              </Link>

              <Link
                href="/admin/offers"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Офферы
              </Link>

              <Link
                href="/admin/verifications"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Студенты
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalPending}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{pendingOffers}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Offers
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{pendingVerifications}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Students
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="ub-card rounded-[28px] p-5">
          <p className="text-sm font-bold text-[#6B7280]">Pending partners</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {pendingPartners}
          </p>
        </article>

        <article className="ub-card rounded-[28px] p-5">
          <p className="text-sm font-bold text-[#6B7280]">Pending offers</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {pendingOffers}
          </p>
        </article>

        <article className="ub-card rounded-[28px] p-5">
          <p className="text-sm font-bold text-[#6B7280]">
            Pending verifications
          </p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {pendingVerifications}
          </p>
        </article>
      </section>

      {queueQuery.error && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Не удалось загрузить очередь: {queueQuery.error.message}
        </div>
      )}

      {queueQuery.isLoading && !data ? (
        <LoadingModeration />
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          <QueueCard
            title="Партнёры"
            count={pendingPartners}
            href="/admin/partners"
            badge="Partners"
            description="Компании, которые ожидают решения администратора."
          >
            {(data?.pendingPartners ?? []).length === 0 ? (
              <EmptyItem text="Нет pending-партнёров." />
            ) : (
              (data?.pendingPartners ?? []).map((partner) => (
                <QueueItem
                  key={partner.id}
                  title={partner.brandName}
                  subtitle={`${partner.legalName} · ${partner.contactEmail}`}
                  tag="review"
                />
              ))
            )}
          </QueueCard>

          <QueueCard
            title="Офферы"
            count={pendingOffers}
            href="/admin/offers"
            badge="Offers"
            description="Скидки, отправленные партнёрами на публикацию."
          >
            {(data?.pendingOffers ?? []).length === 0 ? (
              <EmptyItem text="Нет pending-офферов." />
            ) : (
              (data?.pendingOffers ?? []).map((offer) => (
                <QueueItem
                  key={offer.id}
                  title={offer.title}
                  subtitle={`${offer.partner?.brandName ?? "—"} · ${offer.status}`}
                  tag="pending"
                />
              ))
            )}
          </QueueCard>

          <QueueCard
            title="Студенты"
            count={pendingVerifications}
            href="/admin/verifications"
            badge="Students"
            description="PDF-заявки на подтверждение студенческого статуса."
          >
            {(data?.pendingVerifications ?? []).length === 0 ? (
              <EmptyItem text="Нет pending-верификаций." />
            ) : (
              (data?.pendingVerifications ?? []).map((verification) => (
                <QueueItem
                  key={verification.id}
                  title={
                    verification.user?.email ??
                    verification.submittedEmail ??
                    "Студент"
                  }
                  subtitle={`${verification.method} · ${verification.status}`}
                  tag="verify"
                />
              ))
            )}
          </QueueCard>
        </section>
      )}
    </div>
  );
}