"use client";

import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type RequestStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | string;

type RequestDecision = "approve" | "reject" | "cancel" | string | null;

type PartnerRequestItem = {
  id: string;
  type: string;
  status: RequestStatus;
  decision: RequestDecision;
  decisionComment: string | null;
  entityType: string;
  entityId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt: Date | string | null;
  assignedAdmin: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  resolvedBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  offer: {
    id: string;
    title: string;
    slug: string;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  } | null;
};

type PartnerRequestsData = {
  total: number;
  limit: number;
  offset: number;
  items: PartnerRequestItem[];
};

type StatusFilter =
  | "all"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "cancelled";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "in_review", label: "На проверке" },
  { value: "approved", label: "Одобрены" },
  { value: "rejected", label: "Отклонены" },
  { value: "cancelled", label: "Отменены" },
];

function requestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    offer_publication: "Публикация скидки",
    offer_update: "Изменение скидки",
    location_add: "Добавление точки",
    staff_access: "Доступ сотрудника",
    content_moderation: "Модерация контента",
  };

  return labels[type] ?? type;
}

function entityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    offer: "Оффер",
    partner: "Партнёр",
    review: "Отзыв",
    student_verification: "Верификация студента",
  };

  return labels[entityType] ?? entityType;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Ожидает",
    in_review: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
    cancelled: "Отменено",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending" || status === "in_review") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "rejected" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function decisionLabel(decision: RequestDecision): string {
  if (!decision) {
    return "Решения пока нет";
  }

  const labels: Record<string, string> = {
    approve: "Одобрено",
    reject: "Отклонено",
    cancel: "Отменено",
  };

  return labels[decision] ?? decision;
}

function decisionClass(decision: RequestDecision): string {
  if (decision === "approve") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (decision === "reject" || decision === "cancel") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function offerStatusLabel(status?: string | null): string {
  if (!status) {
    return "—";
  }

  const labels: Record<string, string> = {
    draft: "Черновик",
    pending_review: "На модерации",
    approved: "Одобрен",
    published: "Опубликован",
    rejected: "Отклонён",
    archived: "Архив",
  };

  return labels[status] ?? status;
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function getStatusCount(items: PartnerRequestItem[], status: string): number {
  return items.filter((item) => item.status === status).length;
}

function getRequestTitle(request: PartnerRequestItem): string {
  if (request.offer?.title) {
    return request.offer.title;
  }

  return `${requestTypeLabel(request.type)} #${request.id.slice(0, 8)}`;
}

function getRequestDescription(request: PartnerRequestItem): string {
  if (request.status === "pending") {
    return "Заявка создана и ожидает решения администратора.";
  }

  if (request.status === "in_review") {
    return "Администратор взял заявку в работу и проверяет данные.";
  }

  if (request.status === "approved") {
    return "Заявка успешно одобрена. Оффер может быть опубликован или уже опубликован.";
  }

  if (request.status === "rejected") {
    return "Заявка отклонена. Ознакомьтесь с комментарием администратора и исправьте оффер.";
  }

  if (request.status === "cancelled") {
    return "Заявка отменена и больше не участвует в модерации.";
  }

  return "Заявка партнёра находится в workflow модерации.";
}

function LoadingRequests(): JSX.Element {
  return (
    <section className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="ub-skeleton h-7 w-40 rounded-full" />
              <div className="ub-skeleton mt-5 h-7 w-2/3 rounded-full" />
              <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
            </div>

            <div className="grid gap-3">
              <div className="ub-skeleton h-12 rounded-2xl" />
              <div className="ub-skeleton h-12 rounded-2xl" />
              <div className="ub-skeleton h-12 rounded-2xl" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function EmptyRequests({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        REQ
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Заявки не найдены
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilters
          ? "По выбранному статусу или поиску заявок нет. Сбросьте фильтры или измените запрос."
          : "Когда партнёр отправит скидку на модерацию, заявка появится здесь."}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
          >
            Сбросить фильтры
          </button>
        )}

        <Link
          href="/partner/offers"
          className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Открыть скидки
        </Link>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: number;
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

function RequestCard({
  request,
}: {
  request: PartnerRequestItem;
}): JSX.Element {
  const title = getRequestTitle(request);
  const description = getRequestDescription(request);

  return (
    <article className="ub-card rounded-[30px] p-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                statusClass(request.status),
              ].join(" ")}
            >
              {statusLabel(request.status)}
            </span>

            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                decisionClass(request.decision),
              ].join(" ")}
            >
              {decisionLabel(request.decision)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {requestTypeLabel(request.type)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {entityTypeLabel(request.entityType)}
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-black leading-tight text-[#17384B]">
            {title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7280]">
            {description}
          </p>

          {request.decisionComment && (
            <div className="mt-5 rounded-[24px] border border-[#FFE0D8] bg-[#FFF7F4] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FF7F6E]">
                Комментарий администратора
              </p>

              <p className="mt-2 text-sm leading-7 text-[#8A4B3F]">
                {request.decisionComment}
              </p>
            </div>
          )}

          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Оффер
              </p>

              <p className="mt-1 font-bold text-[#17384B]">
                {request.offer?.title ?? "—"}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                Статус оффера: {offerStatusLabel(request.offer?.status)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Request ID
              </p>

              <p className="mt-1 break-all font-bold text-[#17384B]">
                {request.id}
              </p>

              <p className="mt-1 break-all text-xs leading-5 text-[#6B7280]">
                Entity: {request.entityId}
              </p>
            </div>
          </div>
        </div>

        <aside className="grid gap-3">
          <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-4">
            <p className="text-sm font-black text-[#17384B]">Timeline</p>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="font-bold text-[#526470]">Создано</span>
                <span className="text-right font-black text-[#17384B]">
                  {formatDateTime(request.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="font-bold text-[#526470]">Обновлено</span>
                <span className="text-right font-black text-[#17384B]">
                  {formatDateTime(request.updatedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="font-bold text-[#526470]">Решено</span>
                <span className="text-right font-black text-[#17384B]">
                  {formatDateTime(request.resolvedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E5ECE9] bg-white p-4">
            <p className="text-sm font-black text-[#17384B]">Moderation</p>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-[#F9FAF8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                  Assigned admin
                </p>

                <p className="mt-1 break-all font-bold text-[#17384B]">
                  {request.assignedAdmin?.displayName ??
                    request.assignedAdmin?.email ??
                    "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F9FAF8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                  Resolved by
                </p>

                <p className="mt-1 break-all font-bold text-[#17384B]">
                  {request.resolvedBy?.displayName ??
                    request.resolvedBy?.email ??
                    "—"}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/partner/offers"
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
          >
            Открыть скидки →
          </Link>
        </aside>
      </div>
    </article>
  );
}

export default function PartnerRequestsPage(): JSX.Element {
  const trpc = useTRPC();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const requestsQuery = useQuery({
    ...trpc.business.partner.listRequests.queryOptions({
      limit: 50,
      offset: 0,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const requestsData = requestsQuery.data as PartnerRequestsData | undefined;
  const requests = useMemo(
    () => requestsData?.items ?? [],
    [requestsData?.items]
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        request.id,
        request.type,
        request.status,
        request.decision,
        request.decisionComment,
        request.entityType,
        request.entityId,
        request.offer?.title,
        request.offer?.slug,
        request.offer?.status,
        request.assignedAdmin?.email,
        request.assignedAdmin?.displayName,
        request.resolvedBy?.email,
        request.resolvedBy?.displayName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [requests, search, statusFilter]);

  const totalRequests = requests.length;
  const pendingCount = getStatusCount(requests, "pending");
  const reviewCount = getStatusCount(requests, "in_review");
  const approvedCount = getStatusCount(requests, "approved");
  const rejectedCount = getStatusCount(requests, "rejected");

  const hasFilters = statusFilter !== "all" || search.trim().length > 0;

  function resetFilters(): void {
    setStatusFilter("all");
    setSearch("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Partner / Requests
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Заявки партнёра
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Здесь отображаются реальные moderation tasks: отправленные на
              проверку офферы, решения администратора, комментарии и текущий
              статус заявки.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/partner/offers"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Скидки партнёра
              </Link>

              <Link
                href="/partner/offers/new"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Создать скидку
              </Link>

              <Link
                href="/partner/locations"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Точки продаж
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalRequests}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{pendingCount + reviewCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                In review
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{approvedCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Approved
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Всего заявок"
          value={totalRequests}
          hint="реальные moderation tasks"
          index={0}
        />

        <MetricCard
          label="Ожидают"
          value={pendingCount}
          hint="ещё не взяты в работу"
          index={1}
        />

        <MetricCard
          label="На проверке"
          value={reviewCount}
          hint="модератор проверяет"
          index={2}
        />

        <MetricCard
          label="Отклонено"
          value={rejectedCount}
          hint="требуют исправлений"
          index={3}
        />
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр заявок
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Показано: {filteredRequests.length} из {requests.length}
            </h2>
          </div>

          <label className="w-full lg:w-[360px]">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Поиск
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Оффер, статус, комментарий..."
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={[
                  "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                  isActive
                    ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                    : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#17384B] transition hover:bg-white"
            >
              Сбросить
            </button>
          )}
        </div>
      </section>

      {requestsQuery.error && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Не удалось загрузить заявки: {requestsQuery.error.message}
        </div>
      )}

      {requestsQuery.isLoading && !requestsQuery.data ? (
        <LoadingRequests />
      ) : filteredRequests.length === 0 ? (
        <EmptyRequests hasFilters={hasFilters} onReset={resetFilters} />
      ) : (
        <section className="grid gap-4">
          {filteredRequests.map((request, index) => (
            <div
              key={request.id}
              className={[
                "ub-animate-fade-up",
                index === 1 ? "ub-delay-100" : "",
                index === 2 ? "ub-delay-200" : "",
              ].join(" ")}
            >
              <RequestCard request={request} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}