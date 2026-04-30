"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type AdminDashboardData = {
  metrics: {
    totalUsers: number;
    totalPartners: number;
    approvedPartners: number;
    totalOffers: number;
    publishedOffers: number;
    totalRedemptions: number;
    usedRedemptions: number;
  };
  recentPartners: Array<{
    id: string;
    brandName: string;
    legalName: string;
    status: string;
  }>;
  recentOffers: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
};

const sections = [
  {
    href: "/admin/users",
    title: "Пользователи",
    description: "Студенты, сотрудники, партнёры, администраторы и роли.",
    badge: "Users",
  },
  {
    href: "/admin/verifications",
    title: "Проверка студентов",
    description:
      "PDF электронного студенческого, approve/reject и verified-статус.",
    badge: "Verify",
  },
  {
    href: "/admin/partners",
    title: "Партнёры",
    description: "Компании, точки, сотрудники, заявки и статус проверки.",
    badge: "Partners",
  },
  {
    href: "/admin/offers",
    title: "Офферы",
    description: "Все скидки платформы, публикация, блокировка и архив.",
    badge: "Offers",
  },
  {
    href: "/admin/categories",
    title: "Категории",
    description: "Каталог скидок: разделы, сортировка и активность.",
    badge: "Catalog",
  },
  {
    href: "/admin/moderation",
    title: "Модерация",
    description: "Заявки, отзывы, жалобы и проверка контента.",
    badge: "Review",
  },
  {
    href: "/admin/analytics",
    title: "Аналитика",
    description: "Показатели платформы, рост, популярные офферы и партнёры.",
    badge: "Stats",
  },
  {
    href: "/admin/audit",
    title: "Аудит",
    description: "Журнал действий администраторов, партнёров и сотрудников.",
    badge: "Audit",
  },
];

function statusLabel(status?: string | null): string {
  const labels: Record<string, string> = {
    pending_review: "На модерации",
    approved: "Одобрен",
    rejected: "Отклонён",
    suspended: "Приостановлен",
    published: "Опубликован",
    draft: "Черновик",
    archived: "Архив",
  };

  return status ? labels[status] ?? status : "Не указан";
}

function statusClass(status?: string | null): string {
  if (status === "approved" || status === "published") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending_review" || status === "draft") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "rejected" || status === "suspended" || status === "archived") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function LoadingAdminDashboard(): JSX.Element {
  return (
    <div className="mt-6 grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="ub-card rounded-[30px] p-5">
            <div className="ub-skeleton h-4 w-28 rounded-full" />
            <div className="ub-skeleton mt-5 h-10 w-24 rounded-full" />
            <div className="ub-skeleton mt-4 h-4 w-36 rounded-full" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="ub-card rounded-[30px] p-6">
            <div className="ub-skeleton h-8 w-24 rounded-full" />
            <div className="ub-skeleton mt-5 h-5 w-3/4 rounded-full" />
            <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
            <div className="ub-skeleton mt-3 h-4 w-2/3 rounded-full" />
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
  index,
}: {
  label: string;
  value: string | number;
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

function SectionCard({
  href,
  title,
  description,
  badge,
  index,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
  index: number;
}): JSX.Element {
  return (
    <Link
      href={href}
      className={[
        "ub-card group rounded-[30px] p-6",
        index === 1 ? "ub-delay-100" : "",
        index === 2 ? "ub-delay-200" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-2xl bg-[#FFF0EB] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#FF7F6E]">
          {badge}
        </span>

        <span className="text-lg font-black text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-[#FF7F6E]">
          →
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black text-[#17384B]">{title}</h2>

      <p className="mt-3 text-sm leading-7 text-[#6B7280]">{description}</p>

      <span className="mt-5 inline-flex text-sm font-black text-[#FF7F6E]">
        Открыть раздел →
      </span>
    </Link>
  );
}

export default function AdminPortalPage(): JSX.Element {
  const trpc = useTRPC();

  const adminQuery = useQuery({
    ...trpc.business.admin.getDashboard.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const adminData = adminQuery.data as AdminDashboardData | undefined;

  const moderationCount =
    (adminData?.metrics.totalPartners ?? 0) -
    (adminData?.metrics.approvedPartners ?? 0);

  const metrics = [
    {
      label: "Пользователи",
      value: adminData?.metrics.totalUsers ?? 0,
      hint: "в users",
    },
    {
      label: "Партнёры",
      value: adminData?.metrics.totalPartners ?? 0,
      hint: `${adminData?.metrics.approvedPartners ?? 0} approved`,
    },
    {
      label: "Офферы",
      value: adminData?.metrics.totalOffers ?? 0,
      hint: `${adminData?.metrics.publishedOffers ?? 0} published`,
    },
    {
      label: "QR использований",
      value: adminData?.metrics.totalRedemptions ?? 0,
      hint: `${adminData?.metrics.usedRedemptions ?? 0} used`,
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
              Admin Dashboard
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Администрирование UniBestia
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Центральный раздел управления системой: пользователи, партнёры,
              скидки, модерация, аналитика и журнал действий.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/admin/moderation"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Открыть модерацию
              </Link>

              <Link
                href="/admin/analytics"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Смотреть аналитику
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {adminData?.metrics.totalUsers ?? 0}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Users
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {adminData?.metrics.publishedOffers ?? 0}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Published
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {moderationCount > 0 ? moderationCount : 0}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Review
              </p>
            </div>
          </div>
        </div>
      </section>

      {adminQuery.error && (
        <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-sm font-black uppercase tracking-[0.14em]">
            Ошибка загрузки
          </p>

          <p className="mt-2 text-sm leading-6">
            Не удалось загрузить админ-данные: {adminQuery.error.message}
          </p>
        </div>
      )}

      {adminQuery.isLoading && !adminData ? (
        <LoadingAdminDashboard />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
                index={index}
              />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="space-y-6">
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                      Разделы
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-[#17384B] md:text-3xl">
                      Управление платформой
                    </h2>
                  </div>

                  {adminQuery.isFetching && adminData && (
                    <span className="w-fit rounded-2xl border border-[#E5ECE9] bg-white px-4 py-2 text-xs font-black text-[#526470]">
                      Обновляем данные...
                    </span>
                  )}
                </div>

                <div className="mt-5 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sections.map((section, index) => (
                    <SectionCard
                      key={section.href}
                      href={section.href}
                      title={section.title}
                      description={section.description}
                      badge={section.badge}
                      index={index}
                    />
                  ))}
                </div>
              </section>

              <section className="ub-card rounded-[34px] p-6 md:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                      Offers
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                      Последние офферы
                    </h2>
                  </div>

                  <Link
                    href="/admin/offers"
                    className="text-sm font-black text-[#FF7F6E]"
                  >
                    Все офферы →
                  </Link>
                </div>

                <div className="mt-5 grid gap-3">
                  {(adminData?.recentOffers ?? []).length === 0 ? (
                    <div className="rounded-[26px] bg-[#F9FAF8] p-6 text-sm leading-7 text-[#6B7280]">
                      Последних офферов пока нет.
                    </div>
                  ) : (
                    (adminData?.recentOffers ?? []).map((offer) => (
                      <Link
                        key={offer.id}
                        href="/admin/offers"
                        className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-black text-[#17384B]">
                              {offer.title}
                            </p>

                            <p className="mt-1 text-sm text-[#6B7280]">
                              {offer.slug}
                            </p>
                          </div>

                          <span
                            className={[
                              "w-fit shrink-0 rounded-2xl border px-3 py-1 text-sm font-black",
                              statusClass(offer.status),
                            ].join(" ")}
                          >
                            {statusLabel(offer.status)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-[92px]">
              <section className="ub-card rounded-[34px] p-6 md:p-7">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Partners
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Последние партнёры
                </h2>

                <div className="mt-5 grid gap-3">
                  {(adminData?.recentPartners ?? []).length === 0 ? (
                    <div className="rounded-[26px] bg-[#F9FAF8] p-5 text-sm leading-7 text-[#6B7280]">
                      Последних партнёров пока нет.
                    </div>
                  ) : (
                    (adminData?.recentPartners ?? []).map((partner) => (
                      <Link
                        key={partner.id}
                        href="/admin/partners"
                        className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
                      >
                        <p className="line-clamp-1 font-black text-[#17384B]">
                          {partner.brandName}
                        </p>

                        <p className="mt-1 line-clamp-1 text-sm text-[#6B7280]">
                          {partner.legalName}
                        </p>

                        <span
                          className={[
                            "mt-3 inline-flex rounded-2xl border px-3 py-1 text-xs font-black",
                            statusClass(partner.status),
                          ].join(" ")}
                        >
                          {statusLabel(partner.status)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[34px] border border-[#E5ECE9] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF7F4_100%)] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)] md:p-7">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
                  Quick actions
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Быстрые действия
                </h2>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/admin/moderation"
                    className="rounded-2xl bg-[#17384B] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#255B73]"
                  >
                    Модерация
                  </Link>

                  <Link
                    href="/admin/partners"
                    className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
                  >
                    Партнёры
                  </Link>

                  <Link
                    href="/admin/audit"
                    className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
                  >
                    Аудит
                  </Link>
                </div>
              </section>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}