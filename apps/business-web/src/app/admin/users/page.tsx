"use client";

import { type JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

const statuses = ["active", "blocked", "pending", "disabled"] as const;

type UserStatus = (typeof statuses)[number];
type UserStatusFilter = "all" | UserStatus;

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

function statusClassName(status: string): string {
  if (status === "active") {
    return "rounded-xl bg-green-50 px-3 py-1 text-xs font-black text-green-700";
  }

  if (status === "blocked" || status === "disabled") {
    return "rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-red-700";
  }

  return "rounded-xl bg-amber-50 px-3 py-1 text-xs font-black text-amber-700";
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

  const users = usersQuery.data?.items ?? [];

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

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Users
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Пользователи
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Просмотр пользователей, ролей, статусов и привязки к партнёрам.
          Действия со статусом пишутся в audit_logs как user.status_updated.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email/name/phone"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <input
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            placeholder="Роль: admin, student, partner..."
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as UserStatusFilter)
            }
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none"
          >
            <option value="all">Все статусы</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 text-sm text-[#6B7280]">
          Найдено: {usersQuery.data?.total ?? 0}
        </p>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {usersQuery.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить пользователей: {usersQuery.error.message}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="hidden grid-cols-[1.2fr_0.7fr_0.8fr_0.8fr_1fr] border-b border-[#E5ECE9] bg-[#F9FAF8] px-5 py-4 text-sm font-black text-[#17384B] xl:grid">
          <div>Пользователь</div>
          <div>Статус</div>
          <div>Роли</div>
          <div>Партнёр</div>
          <div>Действия</div>
        </div>

        {usersQuery.isLoading ? (
          <div className="p-5 text-sm text-[#6B7280]">Загружаем...</div>
        ) : users.length === 0 ? (
          <div className="p-5 text-sm text-[#6B7280]">
            Пользователи не найдены.
          </div>
        ) : (
          users.map((user) => {
            const isBusy = busyUserId === user.id;
            const partner = user.activePartnerMemberships[0]?.partner;

            return (
              <div
                key={user.id}
                className="grid gap-4 border-b border-[#E5ECE9] px-5 py-4 text-sm last:border-b-0 xl:grid-cols-[1.2fr_0.7fr_0.8fr_0.8fr_1fr]"
              >
                <div>
                  <p className="font-black text-[#17384B]">
                    {user.displayName ?? user.email}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">{user.email}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Created: {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className={statusClassName(user.status)}>
                    {statusLabel(user.status)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {user.roles.length === 0 ? (
                    <span className="text-xs text-[#9CA3AF]">Без ролей</span>
                  ) : (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-xl bg-[#F7F6F1] px-2 py-1 text-xs font-bold text-[#526470]"
                      >
                        {role}
                      </span>
                    ))
                  )}
                </div>

                <div>
                  {partner ? (
                    <>
                      <p className="font-bold text-[#17384B]">
                        {partner.brandName}
                      </p>
                      <p className="text-xs text-[#6B7280]">{partner.status}</p>
                    </>
                  ) : (
                    <span className="text-xs text-[#9CA3AF]">—</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(user.id, "active")}
                    disabled={isBusy || user.status === "active"}
                    className="rounded-2xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 disabled:opacity-50"
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(user.id, "blocked")}
                    disabled={isBusy || user.status === "blocked"}
                    className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                  >
                    Block
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(user.id, "disabled")}
                    disabled={isBusy || user.status === "disabled"}
                    className="rounded-2xl border border-[#D8E3DE] px-3 py-2 text-xs font-bold text-[#526470] disabled:opacity-50"
                  >
                    Disable
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
