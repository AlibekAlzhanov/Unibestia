"use client";

import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

const statuses = ["active", "blocked", "pending", "disabled"] as const;

type UserStatus = (typeof statuses)[number];
type UserStatusFilter = "all" | UserStatus;

type UserItem = {
  id: string;
  email: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status: UserStatus;
  roles: string[];
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  activePartnerMemberships: Array<{
    role?: string | null;
    partner?: {
      id: string;
      brandName: string;
      status: string;
    } | null;
  }>;
};

const filterOptions: Array<{ value: UserStatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "pending", label: "Ожидают" },
  { value: "blocked", label: "Заблокированы" },
  { value: "disabled", label: "Отключены" },
];

const quickRoles = ["", "admin", "student", "partner", "staff"];

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    all: "Все статусы",
    active: "Активен",
    blocked: "Заблокирован",
    pending: "Ожидает",
    disabled: "Отключён",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "active") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "blocked" || status === "disabled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function getUserName(user: UserItem): string {
  return (
    user.displayName ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email
  );
}

function getStatusCount(users: UserItem[], status: UserStatus): number {
  return users.filter((user) => user.status === status).length;
}

function getRoleLabel(role: string): string {
  if (!role) {
    return "Все роли";
  }

  const labels: Record<string, string> = {
    admin: "Admin",
    student: "Student",
    partner: "Partner",
    staff: "Staff",
  };

  return labels[role] ?? role;
}

function actionButtonClass(targetStatus: UserStatus): string {
  if (targetStatus === "active") {
    return "rounded-2xl bg-[#17384B] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (targetStatus === "blocked") {
    return "rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.16)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#526470] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50";
}

function LoadingUsers(): JSX.Element {
  return (
    <section className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex-1">
              <div className="ub-skeleton h-7 w-32 rounded-full" />
              <div className="ub-skeleton mt-5 h-6 w-2/3 rounded-full" />
              <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
            </div>

            <div className="grid w-full gap-3 xl:w-[320px]">
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

function EmptyUsers({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        U
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Пользователи не найдены
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilters
          ? "Попробуй изменить поиск, роль или статус пользователя."
          : "Пока в системе нет пользователей для отображения."}
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

function UserCard({
  user,
  isBusy,
  onUpdateStatus,
}: {
  user: UserItem;
  isBusy: boolean;
  onUpdateStatus: (status: UserStatus) => void;
}): JSX.Element {
  const partner = user.activePartnerMemberships[0]?.partner;
  const membershipRole = user.activePartnerMemberships[0]?.role;

  return (
    <article className="ub-card rounded-[30px] p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                statusClass(user.status),
              ].join(" ")}
            >
              {statusLabel(user.status)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              ID: {user.id.slice(0, 8)}
            </span>

            {user.roles.length === 0 ? (
              <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#9CA3AF]">
                Без ролей
              </span>
            ) : (
              user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]"
                >
                  {role}
                </span>
              ))
            )}
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-[#17384B]">
            {getUserName(user)}
          </h2>

          <p className="mt-2 break-all text-sm font-bold text-[#526470]">
            {user.email}
          </p>

          {user.phone && (
            <p className="mt-1 text-sm text-[#6B7280]">{user.phone}</p>
          )}

          <div className="mt-5 grid gap-3 text-sm text-[#6B7280] md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Created
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(user.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Updated
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(user.updatedAt)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Partner
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {partner?.brandName ?? "—"}
              </p>
              {partner && (
                <p className="mt-1 text-xs text-[#6B7280]">
                  {partner.status}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Membership role
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {membershipRole ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <aside className="grid w-full gap-3 xl:w-[320px] xl:shrink-0">
          <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-4">
            <p className="text-sm font-black text-[#17384B]">
              Управление статусом
            </p>

            <p className="mt-1 text-xs leading-5 text-[#6B7280]">
              Изменение статуса фиксируется в audit_logs как
              user.status_updated.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateStatus("active")}
            disabled={isBusy || user.status === "active"}
            className={actionButtonClass("active")}
          >
            {isBusy ? "Обработка..." : "Активировать"}
          </button>

          <button
            type="button"
            onClick={() => onUpdateStatus("blocked")}
            disabled={isBusy || user.status === "blocked"}
            className={actionButtonClass("blocked")}
          >
            {isBusy ? "Обработка..." : "Заблокировать"}
          </button>

          <button
            type="button"
            onClick={() => onUpdateStatus("disabled")}
            disabled={isBusy || user.status === "disabled"}
            className={actionButtonClass("disabled")}
          >
            {isBusy ? "Обработка..." : "Отключить"}
          </button>
        </aside>
      </div>
    </article>
  );
}

export default function AdminUsersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery(
    trpc.business.admin.listUsers.queryOptions({
      status: statusFilter === "all" ? undefined : statusFilter,
      role: roleFilter.trim() || undefined,
      search: search.trim() || undefined,
      limit: 100,
      offset: 0,
    })
  );

  const users = useMemo(
    () => (usersQuery.data?.items ?? []) as UserItem[],
    [usersQuery.data?.items]
  );

  const totalUsers = usersQuery.data?.total ?? users.length;
  const activeCount = getStatusCount(users, "active");
  const pendingCount = getStatusCount(users, "pending");
  const blockedCount =
    getStatusCount(users, "blocked") + getStatusCount(users, "disabled");

  const hasFilters =
    statusFilter !== "all" || roleFilter.trim().length > 0 || search.trim().length > 0;

  async function updateStatus(userId: string, status: UserStatus): Promise<void> {
    setBusyUserId(userId);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.admin.updateUserStatus.mutate({
        userId,
        status,
      });

      setMessage("Статус пользователя обновлён.");
      await usersQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить пользователя"
      );
    } finally {
      setBusyUserId(null);
    }
  }

  function resetFilters(): void {
    setStatusFilter("all");
    setRoleFilter("");
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
              Admin / Users
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Пользователи платформы
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Просматривайте студентов, партнёров, сотрудников и администраторов.
              Управляйте статусами пользователей и контролируйте привязку к
              партнёрским организациям.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalUsers}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Active
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{blockedCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Blocked
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px] xl:items-end">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                Поиск
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Email, имя или телефон..."
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>

            <label>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                Роль
              </span>

              <input
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                placeholder="admin, student, partner..."
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-white px-5 text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
          >
            Сбросить
          </button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {filterOptions.map((option) => {
            const isActive = statusFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={[
                  "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                  isActive
                    ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                    : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickRoles.map((role) => {
            const isActive = roleFilter === role;

            return (
              <button
                key={role || "all"}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={[
                  "rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                  isActive
                    ? "bg-[#FFF0EB] text-[#FF7F6E]"
                    : "bg-[#F7F6F1] text-[#526470] hover:bg-[#FFF0EB] hover:text-[#FF7F6E]",
                ].join(" ")}
              >
                {getRoleLabel(role)}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm font-bold text-[#6B7280]">
          Найдено: {totalUsers} · Pending: {pendingCount}
        </p>
      </section>

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {usersQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить пользователей: {usersQuery.error.message}
        </div>
      )}

      {usersQuery.isLoading ? (
        <LoadingUsers />
      ) : users.length === 0 ? (
        <EmptyUsers hasFilters={hasFilters} onReset={resetFilters} />
      ) : (
        <section className="grid gap-4">
          {users.map((user, index) => {
            const isBusy = busyUserId === user.id;

            return (
              <div
                key={user.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <UserCard
                  user={user}
                  isBusy={isBusy}
                  onUpdateStatus={(status) => {
                    void updateStatus(user.id, status);
                  }}
                />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}