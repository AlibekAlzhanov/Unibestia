"use client";

import Link from "next/link";
import { type JSX, useMemo, useState } from "react";

type RequestStatus =
  | "pending"
  | "review"
  | "approved"
  | "rejected"
  | "cancelled";

type RequestType =
  | "offer_publication"
  | "offer_update"
  | "location_add"
  | "staff_access"
  | "content_moderation";

type PartnerRequest = {
  id: string;
  title: string;
  type: RequestType;
  status: RequestStatus;
  description: string;
  target: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
};

type StatusFilter = "all" | RequestStatus;

const requests: PartnerRequest[] = [
  {
    id: "req-001",
    title: "Публикация скидки 10% на обеды",
    type: "offer_publication",
    status: "pending",
    description:
      "Партнёр отправил новую скидку на модерацию. После одобрения скидка станет доступна студентам в каталоге.",
    target: "Lunch 10%",
    priority: "high",
    createdAt: "2026-04-27T10:15:00",
    updatedAt: "2026-04-27T10:15:00",
  },
  {
    id: "req-002",
    title: "Изменение условий Coffee 15%",
    type: "offer_update",
    status: "review",
    description:
      "Запрос на изменение текста условий, минимальной суммы заказа и описания скидки.",
    target: "Coffee 15%",
    priority: "medium",
    createdAt: "2026-04-26T16:30:00",
    updatedAt: "2026-04-27T09:10:00",
  },
  {
    id: "req-003",
    title: "Добавление новой точки продаж",
    type: "location_add",
    status: "approved",
    description:
      "Новая точка продаж проверена и может использоваться при создании офферов и QR-redemptions.",
    target: "Satbayev Campus Point",
    priority: "low",
    createdAt: "2026-04-25T13:20:00",
    updatedAt: "2026-04-25T18:45:00",
  },
];

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "review", label: "На проверке" },
  { value: "approved", label: "Одобрены" },
  { value: "rejected", label: "Отклонены" },
  { value: "cancelled", label: "Отменены" },
];

function typeLabel(type: RequestType): string {
  const labels: Record<RequestType, string> = {
    offer_publication: "Публикация скидки",
    offer_update: "Изменение скидки",
    location_add: "Добавление точки",
    staff_access: "Доступ сотрудника",
    content_moderation: "Модерация контента",
  };

  return labels[type];
}

function statusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    pending: "Ожидает",
    review: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
    cancelled: "Отменено",
  };

  return labels[status];
}

function statusClass(status: RequestStatus): string {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending" || status === "review") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "rejected" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function priorityLabel(priority: PartnerRequest["priority"]): string {
  const labels: Record<PartnerRequest["priority"], string> = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  return labels[priority];
}

function priorityClass(priority: PartnerRequest["priority"]): string {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-green-200 bg-green-50 text-green-700";
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

function getStatusCount(items: PartnerRequest[], status: RequestStatus): number {
  return items.filter((item) => item.status === status).length;
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
          : "Когда партнёр отправит скидку на модерацию, изменит условия или добавит точку, заявка появится здесь."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Сбросить фильтры
        </button>
      )}
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

function RequestCard({ request }: { request: PartnerRequest }): JSX.Element {
  return (
    <article className="ub-card rounded-[30px] p-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
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
                priorityClass(request.priority),
              ].join(" ")}
            >
              {priorityLabel(request.priority)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {typeLabel(request.type)}
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-black leading-tight text-[#17384B]">
            {request.title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7280]">
            {request.description}
          </p>

          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Target
              </p>

              <p className="mt-1 font-bold text-[#17384B]">{request.target}</p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Request ID
              </p>

              <p className="mt-1 break-all font-bold text-[#17384B]">
                {request.id}
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
            </div>
          </div>

          <div className="rounded-[24px] border border-[#FFE0D8] bg-[#FFF7F4] p-4 text-sm leading-6 text-[#8A4B3F]">
            Сейчас страница работает как demo-view. Позже можно подключить
            backend-модуль partner_requests и хранить заявки в PostgreSQL.
          </div>
        </aside>
      </div>
    </article>
  );
}

export default function PartnerRequestsPage(): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

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
        request.title,
        request.type,
        request.status,
        request.description,
        request.target,
        request.priority,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [search, statusFilter]);

  const totalRequests = requests.length;
  const pendingCount = getStatusCount(requests, "pending");
  const reviewCount = getStatusCount(requests, "review");
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
              Отслеживайте заявки на публикацию скидок, изменение условий,
              добавление точек и модерацию контента. Раздел показывает, что
              действия партнёра проходят через контролируемый workflow.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/partner/offers"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Скидки партнёра
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
          hint="demo workflow"
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
              placeholder="Название, тип, target..."
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

      {filteredRequests.length === 0 ? (
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