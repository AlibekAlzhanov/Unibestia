"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

const sections = [
  {
    href: "/admin/users",
    title: "Пользователи",
    description: "Студенты, сотрудники, партнёры, администраторы и роли.",
  },
  {
    href: "/admin/partners",
    title: "Партнёры",
    description: "Компании, точки, сотрудники, заявки и статус проверки.",
  },
  {
    href: "/admin/offers",
    title: "Офферы",
    description: "Все скидки платформы, публикация, блокировка и архив.",
  },
  {
    href: "/admin/categories",
    title: "Категории",
    description: "Каталог скидок: разделы, сортировка и активность.",
  },
  {
    href: "/admin/moderation",
    title: "Модерация",
    description: "Заявки, отзывы, жалобы и проверка контента.",
  },
  {
    href: "/admin/analytics",
    title: "Аналитика",
    description: "Показатели платформы, рост, популярные офферы и партнёры.",
  },
  {
    href: "/admin/audit",
    title: "Аудит",
    description: "Журнал действий администраторов, партнёров и сотрудников.",
  },
];

export default function AdminPortalPage(): JSX.Element {
  const trpc = useTRPC();
  const adminQuery = useQuery(trpc.business.admin.getDashboard.queryOptions());

  const metrics = [
    {
      label: "Пользователи",
      value: adminQuery.data?.metrics.totalUsers ?? 0,
      hint: "в users",
    },
    {
      label: "Партнёры",
      value: adminQuery.data?.metrics.totalPartners ?? 0,
      hint: `${adminQuery.data?.metrics.approvedPartners ?? 0} approved`,
    },
    {
      label: "Офферы",
      value: adminQuery.data?.metrics.totalOffers ?? 0,
      hint: `${adminQuery.data?.metrics.publishedOffers ?? 0} published`,
    },
    {
      label: "QR использований",
      value: adminQuery.data?.metrics.totalRedemptions ?? 0,
      hint: `${adminQuery.data?.metrics.usedRedemptions ?? 0} used`,
    },
  ];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Администрирование UniBestia
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Центральный раздел управления всей системой. Счётчики уже подключены
          к PostgreSQL через backend+tRPC.
        </p>
      </section>

      {adminQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить админ-данные: {adminQuery.error.message}
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

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-[#17384B]">
            Последние партнёры
          </h2>
          <div className="mt-4 space-y-3">
            {(adminQuery.data?.recentPartners ?? []).map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-[#E5ECE9] p-4"
              >
                <p className="font-bold text-[#17384B]">{partner.brandName}</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {partner.legalName} · {partner.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-[#17384B]">Последние офферы</h2>
          <div className="mt-4 space-y-3">
            {(adminQuery.data?.recentOffers ?? []).map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-[#E5ECE9] p-4"
              >
                <p className="font-bold text-[#17384B]">{offer.title}</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {offer.slug} · {offer.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
