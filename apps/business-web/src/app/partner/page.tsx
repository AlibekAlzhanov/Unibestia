"use client";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { PartnerLogoUploadCard } from "@/components/media/partner-logo-upload-card";

const sections = [
  {
    href: "/partner/offers",
    title: "Скидки",
    description: "Создание, редактирование, публикация и архивирование офферов.",
  },
  {
    href: "/partner/redemptions",
    title: "Использования",
    description: "История QR-redemptions, статусы, суммы и точки применения.",
  },
  {
    href: "/partner/analytics",
    title: "Аналитика",
    description: "Популярные скидки, динамика использований и эффективность.",
  },
  {
    href: "/partner/locations",
    title: "Точки продаж",
    description: "Адреса партнёра, города, активность и привязка к офферам.",
  },
  {
    href: "/partner/requests",
    title: "Заявки",
    description: "Заявки на публикацию, изменение условий и модерацию скидок.",
  },
  {
    href: "/partner/staff",
    title: "Сотрудники",
    description: "Управление staff-аккаунтами, ролями и доступом к точкам.",
  },
];

export default function PartnerDashboardPage(): JSX.Element {
  const trpc = useTRPC();
  const { getToken } = useAuth();
  const dashboardQuery = useQuery(
    trpc.business.partner.getDashboard.queryOptions()
  );

  const data = dashboardQuery.data;

  const metrics = [
    {
      label: "Всего скидок",
      value: data?.metrics.totalOffers ?? 0,
      hint: `${data?.metrics.publishedOffers ?? 0} опубликовано`,
    },
    {
      label: "Использования QR",
      value: data?.metrics.totalRedemptions ?? 0,
      hint: `${data?.metrics.usedRedemptions ?? 0} использовано`,
    },
    {
      label: "Сумма скидок",
      value: `${Math.round(data?.metrics.totalDiscountAmount ?? 0)} ₸`,
      hint: "по использованным QR",
    },
    {
      label: "Точки продаж",
      value: data?.metrics.activeLocations ?? 0,
      hint: "активные локации",
    },
  ];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">

        <PartnerLogoUploadCard
          logoUrl={data?.partner?.logoUrl}
          getToken={getToken}
          onUploaded={() => dashboardQuery.refetch()}
        />

        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          {data?.partner?.brandName ?? "Кабинет партнёра"}
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Реальные данные берутся из PostgreSQL через tRPC: скидки, QR
          использования, суммы и точки продаж.
        </p>
      </section>

      {dashboardQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить кабинет партнёра: {dashboardQuery.error.message}
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[28px] bg-[#17384B] p-5 text-white shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
          >
            <p className="text-sm font-semibold text-[#DDE8EA]">
              {metric.label}
            </p>
            <p className="mt-2 text-4xl font-black">{metric.value}</p>
            <p className="mt-2 text-sm text-[#FFB5A4]">{metric.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-[28px] border border-[#E5ECE9] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[#FFB5A4]"
          >
            <h2 className="text-xl font-bold text-[#17384B]">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              {section.description}
            </p>
            <span className="mt-5 inline-flex text-sm font-black text-[#FF7F6E]">
              Открыть →
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-bold text-[#17384B]">
          Последние использования
        </h2>
        <div className="mt-4 grid gap-3">
          {(data?.recentRedemptions ?? []).length === 0 ? (
            <p className="text-sm text-[#6B7280]">Использований пока нет.</p>
          ) : (
            data?.recentRedemptions.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#E5ECE9] p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="font-bold text-[#17384B]">
                      {item.offer?.title ?? "Скидка"}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {item.student?.displayName ??
                        item.student?.email ??
                        "Студент"}{" "}
                      · {item.location?.name ?? "Локация не указана"}
                    </p>
                  </div>
                  <span className="w-fit rounded-2xl bg-[#F7F6F1] px-3 py-1 text-sm font-bold text-[#526470]">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
