"use client";

import { type FormEvent, type JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

const roles = ["staff", "manager", "analyst"] as const;

type StaffRole = (typeof roles)[number];

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Владелец",
    manager: "Менеджер",
    staff: "Сотрудник",
    analyst: "Аналитик",
  };

  return labels[role] ?? role;
}

export default function PartnerStaffPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const staffQuery = useQuery(
    trpc.business.partner.listStaffMembers.queryOptions()
  );

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const staffMembers = staffQuery.data?.items ?? [];

  async function handleAddStaff(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setIsAdding(true);
    setMessage(null);
    setError(null);

    try {
      const created = await trpcClient.business.partner.addStaffMember.mutate({
        email,
        role,
      });

      setMessage(
        `Сотрудник добавлен: ${created.user.email} (${roleLabel(created.role)})`
      );
      setEmail("");
      setRole("staff");

      await staffQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось добавить сотрудника"
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function updateRole(memberId: string, newRole: StaffRole): Promise<void> {
    setBusyMemberId(memberId);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.partner.updateStaffMemberRole.mutate({
        memberId,
        role: newRole,
      });

      setMessage("Роль сотрудника обновлена.");
      await staffQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить роль"
      );
    } finally {
      setBusyMemberId(null);
    }
  }

  async function deactivate(memberId: string): Promise<void> {
    setBusyMemberId(memberId);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.partner.deactivateStaffMember.mutate({
        memberId,
      });

      setMessage("Сотрудник деактивирован.");
      await staffQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось деактивировать сотрудника"
      );
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Staff
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Сотрудники партнёра
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Владелец или менеджер может добавить сотрудников к своей компании.
          Обычный staff нужен для будущего staff mobile app и не должен
          пользоваться Business Web как полноценным порталом.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleAddStaff}
          className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
        >
          <h2 className="text-xl font-bold text-[#17384B]">
            Добавить сотрудника
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Пользователь должен хотя бы один раз войти через Clerk, чтобы запись
            появилась в таблице users. После этого его можно добавить по email.
          </p>

          <div className="mt-5 grid gap-4">
            <label>
              <span className="text-sm font-bold text-[#17384B]">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                placeholder="staff@example.com"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#17384B]">Роль</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as StaffRole)}
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
              >
                {roles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleLabel(roleOption)}
                  </option>
                ))}
              </select>
            </label>

            {message && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isAdding}
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isAdding ? "Добавляем..." : "Добавить сотрудника"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-[#17384B]">
            Команда партнёра
          </h2>

          <div className="mt-5 grid gap-4">
            {staffQuery.isLoading ? (
              <p className="text-sm text-[#6B7280]">Загружаем сотрудников...</p>
            ) : staffMembers.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                Сотрудников пока нет.
              </p>
            ) : (
              staffMembers.map((member) => {
                const isOwner = member.role === "owner";
                const isBusy = busyMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-bold text-[#17384B]">
                          {member.user?.displayName ??
                            member.user?.email ??
                            "Пользователь"}
                        </p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {member.user?.email ?? "email не указан"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-2xl bg-white px-3 py-1 text-xs font-bold text-[#526470]">
                            {roleLabel(member.role)}
                          </span>
                          <span className="rounded-2xl bg-white px-3 py-1 text-xs font-bold text-[#526470]">
                            {member.isActive ? "active" : "inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="grid min-w-[180px] gap-2">
                        <select
                          value={member.role === "owner" ? "staff" : member.role}
                          onChange={(event) =>
                            updateRole(member.id, event.target.value as StaffRole)
                          }
                          disabled={isOwner || isBusy || !member.isActive}
                          className="h-10 rounded-2xl border border-[#D8E3DE] bg-white px-3 text-sm font-bold text-[#17384B] disabled:opacity-50"
                        >
                          {roles.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {roleLabel(roleOption)}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => deactivate(member.id)}
                          disabled={isOwner || isBusy || !member.isActive}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                        >
                          Деактивировать
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
