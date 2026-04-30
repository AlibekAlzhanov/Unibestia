"use client";

import Link from "next/link";
import { type FormEvent, type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

const assignableRoles = ["staff", "manager", "analyst"] as const;
const roleFilters = ["all", "owner", "manager", "staff", "analyst", "inactive"] as const;

type StaffRole = (typeof assignableRoles)[number];
type RoleFilter = (typeof roleFilters)[number];

type StaffMember = {
  id: string;
  role: "owner" | StaffRole | string;
  isActive: boolean;
  createdAt?: Date | string | null;
  user?: {
    id?: string;
    email?: string | null;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
};

const roleFilterOptions: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "owner", label: "Владельцы" },
  { value: "manager", label: "Менеджеры" },
  { value: "staff", label: "Staff" },
  { value: "analyst", label: "Аналитики" },
  { value: "inactive", label: "Неактивные" },
];

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Владелец",
    manager: "Менеджер",
    staff: "Сотрудник",
    analyst: "Аналитик",
  };

  return labels[role] ?? role;
}

function roleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    owner: "Полный доступ к компании и управлению командой.",
    manager: "Может управлять офферами, точками и частью команды.",
    staff: "Подходит для проверки QR-кодов и работы на точке.",
    analyst: "Может смотреть аналитику и историю использований.",
  };

  return descriptions[role] ?? "Роль пользователя в партнёрской организации.";
}

function roleClass(role: string): string {
  if (role === "owner") {
    return "border-[#FFD8CE] bg-[#FFF0EB] text-[#FF7F6E]";
  }

  if (role === "manager") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (role === "analyst") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  return "border-green-200 bg-green-50 text-green-700";
}

function statusClass(isActive: boolean): string {
  return isActive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function getUserName(member: StaffMember): string {
  return (
    member.user?.displayName ||
    `${member.user?.firstName ?? ""} ${member.user?.lastName ?? ""}`.trim() ||
    member.user?.email ||
    "Пользователь"
  );
}

function getRoleCount(members: StaffMember[], role: string): number {
  return members.filter((member) => member.role === role && member.isActive).length;
}

function LoadingStaff(): JSX.Element {
  return (
    <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="ub-skeleton h-7 w-32 rounded-full" />
          <div className="ub-skeleton mt-5 h-6 w-3/4 rounded-full" />
          <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="ub-skeleton h-20 rounded-2xl" />
            <div className="ub-skeleton h-20 rounded-2xl" />
          </div>
          <div className="ub-skeleton mt-5 h-12 rounded-2xl" />
        </article>
      ))}
    </section>
  );
}

function EmptyStaff({
  hasFilter,
  onReset,
}: {
  hasFilter: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        👥
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Сотрудники не найдены
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilter
          ? "По выбранному фильтру сотрудников нет. Сбрось фильтр или выбери другую роль."
          : "Добавьте первого сотрудника, чтобы он мог работать с QR-кодами и точками продаж."}
      </p>

      {hasFilter && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Показать всех
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

function RolePicker({
  selectedRole,
  onChange,
}: {
  selectedRole: StaffRole;
  onChange: (role: StaffRole) => void;
}): JSX.Element {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {assignableRoles.map((roleOption) => {
        const isActive = selectedRole === roleOption;

        return (
          <button
            key={roleOption}
            type="button"
            onClick={() => onChange(roleOption)}
            className={[
              "rounded-2xl px-4 py-3 text-sm font-black transition",
              isActive
                ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
            ].join(" ")}
          >
            {roleLabel(roleOption)}
          </button>
        );
      })}
    </div>
  );
}

function StaffMemberCard({
  member,
  isBusy,
  onUpdateRole,
  onDeactivate,
}: {
  member: StaffMember;
  isBusy: boolean;
  onUpdateRole: (role: StaffRole) => void;
  onDeactivate: () => void;
}): JSX.Element {
  const isOwner = member.role === "owner";
  const canManage = !isOwner && member.isActive;

  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={[
            "rounded-2xl border px-3 py-1 text-xs font-black",
            roleClass(member.role),
          ].join(" ")}
        >
          {roleLabel(member.role)}
        </span>

        <span
          className={[
            "rounded-2xl border px-3 py-1 text-xs font-black",
            statusClass(member.isActive),
          ].join(" ")}
        >
          {member.isActive ? "active" : "inactive"}
        </span>
      </div>

      <h2 className="mt-5 line-clamp-2 text-2xl font-black leading-tight text-[#17384B]">
        {getUserName(member)}
      </h2>

      <p className="mt-2 break-all text-sm font-bold text-[#526470]">
        {member.user?.email ?? "email не указан"}
      </p>

      {member.user?.phone && (
        <p className="mt-1 text-sm text-[#6B7280]">{member.user.phone}</p>
      )}

      <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm leading-6 text-[#526470]">
        <span className="font-black text-[#17384B]">Доступ:</span>{" "}
        {roleDescription(member.role)}
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Member ID
          </p>

          <p className="mt-1 break-all font-bold text-[#17384B]">
            {member.id}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Created
          </p>

          <p className="mt-1 font-bold text-[#17384B]">
            {formatDateTime(member.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-auto grid gap-3 pt-5">
        {isOwner ? (
          <div className="rounded-2xl border border-[#FFD8CE] bg-[#FFF7F4] p-4 text-sm leading-6 text-[#8A4B3F]">
            Владелец компании не может быть изменён или деактивирован из этого
            раздела.
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-black text-[#17384B]">
                Изменить роль
              </p>

              <div className="grid gap-2">
                {assignableRoles.map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => onUpdateRole(roleOption)}
                    disabled={!canManage || isBusy || member.role === roleOption}
                    className={[
                      "rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                      member.role === roleOption
                        ? "bg-[#17384B] text-white"
                        : "border border-[#D8E3DE] bg-white text-[#17384B] hover:border-[#FFB5A4] hover:bg-[#F7F6F1]",
                    ].join(" ")}
                  >
                    {isBusy ? "Обновляем..." : roleLabel(roleOption)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onDeactivate}
              disabled={!canManage || isBusy}
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? "Обработка..." : "Деактивировать"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function PartnerStaffPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const staffQuery = useQuery({
    ...trpc.business.partner.listStaffMembers.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const staffMembers = useMemo(
    () => (staffQuery.data?.items ?? []) as StaffMember[],
    [staffQuery.data?.items]
  );

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return staffMembers.filter((member) => {
      if (roleFilter === "inactive" && member.isActive) {
        return false;
      }

      if (
        roleFilter !== "all" &&
        roleFilter !== "inactive" &&
        member.role !== roleFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        member.user?.email,
        member.user?.displayName,
        member.user?.firstName,
        member.user?.lastName,
        member.user?.phone,
        member.role,
        member.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [staffMembers, roleFilter, search]);

  const totalMembers = staffMembers.length;
  const activeMembers = staffMembers.filter((member) => member.isActive).length;
  const inactiveMembers = staffMembers.filter((member) => !member.isActive).length;
  const managers = getRoleCount(staffMembers, "manager");
  const staffCount = getRoleCount(staffMembers, "staff");
  const analysts = getRoleCount(staffMembers, "analyst");

  const hasFilter = roleFilter !== "all" || search.trim().length > 0;

  async function handleAddStaff(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setIsAdding(true);
    setMessage(null);
    setError(null);

    try {
      const created = await trpcClient.business.partner.addStaffMember.mutate({
        email: email.trim(),
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

  function resetFilters(): void {
    setRoleFilter("all");
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
              Partner / Staff
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Сотрудники партнёра
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Добавляйте сотрудников, назначайте роли и ограничивайте доступ.
              Staff-аккаунты нужны для проверки QR-кодов и работы на точках
              продаж.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/staff"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Открыть Staff QR
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
              <p className="text-2xl font-black">{totalMembers}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{activeMembers}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Active
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{managers}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Managers
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Всего"
          value={totalMembers}
          hint="все участники команды"
          index={0}
        />

        <MetricCard
          label="Активные"
          value={activeMembers}
          hint="имеют доступ к функциям"
          index={1}
        />

        <MetricCard
          label="Staff"
          value={staffCount}
          hint="проверка QR и работа на точке"
          index={2}
        />

        <MetricCard
          label="Аналитики"
          value={analysts}
          hint="просмотр статистики"
          index={3}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <form
          onSubmit={handleAddStaff}
          className="ub-animate-fade-up ub-card self-start rounded-[34px] p-6 md:p-7"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Новый сотрудник
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Добавить в команду
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Пользователь должен хотя бы один раз войти через Clerk, чтобы
              запись появилась в таблице users. После этого его можно добавить
              по email.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label>
              <span className="text-sm font-black text-[#17384B]">Email *</span>

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                placeholder="staff@example.com"
                className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-black text-[#17384B]">
                Роль сотрудника
              </p>

              <RolePicker selectedRole={role} onChange={setRole} />

              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                {roleDescription(role)}
              </p>
            </div>

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

            <button
              type="submit"
              disabled={isAdding}
              className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? "Добавляем..." : "Добавить сотрудника"}
            </button>
          </div>
        </form>

        <section className="space-y-5">
          <div className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Команда
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Показано: {filteredMembers.length} из {staffMembers.length}
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Неактивные: {inactiveMembers}
                </p>
              </div>

              <label className="w-full md:w-[320px]">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Поиск
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Email, имя, телефон..."
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
              {roleFilterOptions.map((option) => {
                const isActive = roleFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRoleFilter(option.value)}
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
          </div>

          {staffQuery.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              Не удалось загрузить сотрудников: {staffQuery.error.message}
            </div>
          )}

          {staffQuery.isLoading && !staffQuery.data ? (
            <LoadingStaff />
          ) : filteredMembers.length === 0 ? (
            <EmptyStaff hasFilter={hasFilter} onReset={resetFilters} />
          ) : (
            <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
              {filteredMembers.map((member, index) => (
                <div
                  key={member.id}
                  className={[
                    "ub-animate-fade-up",
                    index === 1 ? "ub-delay-100" : "",
                    index === 2 ? "ub-delay-200" : "",
                  ].join(" ")}
                >
                  <StaffMemberCard
                    member={member}
                    isBusy={busyMemberId === member.id}
                    onUpdateRole={(newRole) => {
                      void updateRole(member.id, newRole);
                    }}
                    onDeactivate={() => {
                      void deactivate(member.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}