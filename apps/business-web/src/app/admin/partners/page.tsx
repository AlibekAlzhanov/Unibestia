"use client";

import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

const statuses = [
  "pending",
  "approved",
  "rejected",
  "suspended",
  "archived",
] as const;

type PartnerStatus = (typeof statuses)[number];
type PartnerStatusFilter = "all" | PartnerStatus;

type PartnerAction = "approve" | "reject" | "suspend" | "restore" | "archive";

type PartnerItem = {
  id: string;
  brandName: string;
  legalName: string;
  description?: string | null;
  status: PartnerStatus;
  rejectionReason?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  createdAt: Date | string;
  approvedAt?: Date | string | null;
  owner?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
};

const filterOptions: Array<{ value: PartnerStatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Одобрены" },
  { value: "rejected", label: "Отклонены" },
  { value: "suspended", label: "Заблокированы" },
  { value: "archived", label: "Архив" },
];

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "На модерации",
    approved: "Одобрен",
    rejected: "Отклонён",
    suspended: "Заблокирован",
    archived: "Архив",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "rejected" || status === "suspended" || status === "archived") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function getReasonPlaceholder(action: PartnerAction): string {
  if (action === "reject") {
    return "Причина отказа, например: не хватает документов";
  }

  if (action === "suspend") {
    return "Причина блокировки, например: нарушение правил платформы";
  }

  if (action === "archive") {
    return "Причина архивации, например: партнёр больше неактивен";
  }

  return "Причина действия";
}

function actionNeedsReason(action: PartnerAction): boolean {
  return action === "reject" || action === "suspend" || action === "archive";
}

function getVisibleActions(status: PartnerStatus): PartnerAction[] {
  if (status === "pending") {
    return ["approve", "reject", "archive"];
  }

  if (status === "approved") {
    return ["suspend", "archive"];
  }

  if (status === "rejected") {
    return ["restore", "archive"];
  }

  if (status === "suspended") {
    return ["restore", "archive"];
  }

  if (status === "archived") {
    return ["restore"];
  }

  return [];
}

function actionLabel(action: PartnerAction): string {
  const labels: Record<PartnerAction, string> = {
    approve: "Одобрить",
    reject: "Отклонить",
    suspend: "Заблокировать",
    restore: "Восстановить",
    archive: "В архив",
  };

  return labels[action];
}

function actionButtonClass(action: PartnerAction, isSelected: boolean): string {
  if (action === "approve" || action === "restore") {
    return [
      "rounded-2xl px-4 py-3 text-sm font-black transition",
      isSelected
        ? "bg-[#17384B] text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)]"
        : "border border-[#D8E3DE] bg-white text-[#17384B] hover:border-[#FFB5A4] hover:bg-[#F7F6F1]",
    ].join(" ");
  }

  if (action === "reject" || action === "archive") {
    return [
      "rounded-2xl px-4 py-3 text-sm font-black transition",
      isSelected
        ? "bg-red-600 text-white shadow-[0_12px_24px_rgba(220,38,38,0.16)]"
        : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    ].join(" ");
  }

  return [
    "rounded-2xl px-4 py-3 text-sm font-black transition",
    isSelected
      ? "bg-[#526470] text-white"
      : "border border-[#D8E3DE] bg-[#F9FAF8] text-[#526470] hover:bg-white",
  ].join(" ");
}

function confirmButtonClass(action: PartnerAction): string {
  if (action === "approve" || action === "restore") {
    return "rounded-2xl bg-[#17384B] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (action === "reject" || action === "archive") {
    return "rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.16)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "rounded-2xl bg-[#526470] px-4 py-3 text-sm font-black text-white transition hover:bg-[#40515B] disabled:cursor-not-allowed disabled:opacity-50";
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function getStatusCount(partners: PartnerItem[], status: PartnerStatus): number {
  return partners.filter((partner) => partner.status === status).length;
}

function LoadingPartners(): JSX.Element {
  return (
    <section className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex-1">
              <div className="ub-skeleton h-7 w-32 rounded-full" />
              <div className="ub-skeleton mt-5 h-6 w-2/3 rounded-full" />
              <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
            </div>

            <div className="grid min-w-[280px] gap-3">
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

function EmptyPartners({
  filterStatus,
  onReset,
}: {
  filterStatus: PartnerStatusFilter;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        B2B
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Партнёров с выбранным статусом нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Текущий фильтр:{" "}
        {filterStatus === "all" ? "Все статусы" : statusLabel(filterStatus)}.
        Можно сбросить фильтр или дождаться новых заявок от партнёров.
      </p>

      {filterStatus !== "all" && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Показать все
        </button>
      )}
    </section>
  );
}

function PartnerCard({
  partner,
  isBusy,
  selectedAction,
  reasonValue,
  onSelectAction,
  onReasonChange,
  onAction,
}: {
  partner: PartnerItem;
  isBusy: boolean;
  selectedAction?: PartnerAction;
  reasonValue: string;
  onSelectAction: (action: PartnerAction) => void;
  onReasonChange: (value: string) => void;
  onAction: (action: PartnerAction) => void;
}): JSX.Element {
  const actions = getVisibleActions(partner.status);
  const needsReason = selectedAction ? actionNeedsReason(selectedAction) : false;
  const isConfirmDisabled =
    isBusy || (needsReason && reasonValue.trim().length < 3);

  return (
    <article className="ub-card rounded-[30px] p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                statusClass(partner.status),
              ].join(" ")}
            >
              {statusLabel(partner.status)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              ID: {partner.id.slice(0, 8)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-[#17384B]">
            {partner.brandName}
          </h2>

          <p className="mt-1 text-sm font-bold text-[#6B7280]">
            {partner.legalName}
          </p>

          {partner.description && (
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6B7280]">
              {partner.description}
            </p>
          )}

          {partner.rejectionReason && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <span className="font-black">Причина:</span>{" "}
              {partner.rejectionReason}
            </div>
          )}

          <div className="mt-5 grid gap-3 text-sm text-[#6B7280] md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Email
              </p>
              <p className="mt-1 break-all font-bold text-[#17384B]">
                {partner.contactEmail}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Phone
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {partner.contactPhone ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Owner
              </p>
              <p className="mt-1 break-all font-bold text-[#17384B]">
                {partner.owner?.displayName ?? partner.owner?.email ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Created
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(partner.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Approved
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(partner.approvedAt)}
              </p>
            </div>
          </div>
        </div>

        <aside className="grid w-full gap-3 xl:w-[320px] xl:shrink-0">
          <div>
            <p className="mb-2 text-sm font-black text-[#17384B]">
              Действие
            </p>

            <div className="grid gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => onSelectAction(action)}
                  disabled={isBusy}
                  className={actionButtonClass(action, selectedAction === action)}
                >
                  {actionLabel(action)}
                </button>
              ))}
            </div>
          </div>

          {selectedAction && (
            <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-4">
              <p className="text-sm font-black text-[#17384B]">
                Подтверждение
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                Выбрано действие:{" "}
                <span className="font-black text-[#17384B]">
                  {actionLabel(selectedAction)}
                </span>
              </p>

              {needsReason && (
                <label className="mt-3 block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                    Причина
                  </span>

                  <textarea
                    value={reasonValue}
                    onChange={(event) => onReasonChange(event.target.value)}
                    placeholder={getReasonPlaceholder(selectedAction)}
                    className="mt-2 min-h-[96px] w-full rounded-2xl border border-[#D8E3DE] bg-white p-3 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                  />

                  <p className="mt-2 text-xs leading-5 text-[#9CA3AF]">
                    Минимум 3 символа.
                  </p>
                </label>
              )}

              <button
                type="button"
                onClick={() => onAction(selectedAction)}
                disabled={isConfirmDisabled}
                className={`${confirmButtonClass(selectedAction)} mt-4 w-full`}
              >
                {isBusy ? "Обработка..." : `Подтвердить: ${actionLabel(selectedAction)}`}
              </button>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

export default function AdminPartnersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [filterStatus, setFilterStatus] =
    useState<PartnerStatusFilter>("all");
  const [busyPartnerId, setBusyPartnerId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonByPartnerId, setReasonByPartnerId] = useState<
    Record<string, string>
  >({});
  const [actionByPartnerId, setActionByPartnerId] = useState<
    Record<string, PartnerAction | undefined>
  >({});

  const partnersQuery = useQuery(
    trpc.business.admin.listPartners.queryOptions({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100,
      offset: 0,
    })
  );

  const partners = useMemo(
    () => (partnersQuery.data?.items ?? []) as PartnerItem[],
    [partnersQuery.data?.items]
  );

  const totalPartners = partnersQuery.data?.total ?? partners.length;
  const pendingCount = getStatusCount(partners, "pending");
  const approvedCount = getStatusCount(partners, "approved");
  const blockedCount =
    getStatusCount(partners, "rejected") +
    getStatusCount(partners, "suspended") +
    getStatusCount(partners, "archived");

  function getActionReason(partnerId: string): string | undefined {
    const value = reasonByPartnerId[partnerId]?.trim();

    if (!value || value.length < 3) {
      return undefined;
    }

    return value;
  }

  async function runAction(
    partnerId: string,
    action: PartnerAction
  ): Promise<void> {
    setBusyPartnerId(partnerId);
    setMessage(null);
    setError(null);

    const reason = getActionReason(partnerId);

    try {
      if (action === "approve") {
        await trpcClient.business.admin.approvePartner.mutate({ partnerId });
        setMessage("Партнёр одобрен.");
      }

      if (action === "reject") {
        await trpcClient.business.admin.rejectPartner.mutate({
          partnerId,
          reason,
        });
        setMessage("Партнёр отклонён.");
      }

      if (action === "suspend") {
        await trpcClient.business.admin.suspendPartner.mutate({
          partnerId,
          reason,
        });
        setMessage("Партнёр заблокирован.");
      }

      if (action === "restore") {
        await trpcClient.business.admin.restorePartner.mutate({ partnerId });
        setMessage("Партнёр восстановлен.");
      }

      if (action === "archive") {
        await trpcClient.business.admin.archivePartner.mutate({
          partnerId,
          reason,
        });
        setMessage("Партнёр отправлен в архив.");
      }

      setReasonByPartnerId((current) => ({
        ...current,
        [partnerId]: "",
      }));

      setActionByPartnerId((current) => ({
        ...current,
        [partnerId]: undefined,
      }));

      await partnersQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось выполнить действие"
      );
    } finally {
      setBusyPartnerId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin / Partners
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Модерация партнёров
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Управляйте заявками компаний: одобрение, отклонение, блокировка,
              восстановление и архивирование. Все действия фиксируются в
              audit_logs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalPartners}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{pendingCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Review
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

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр статуса
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Найдено: {totalPartners}
            </h2>

            <p className="mt-1 text-sm text-[#6B7280]">
              Заблокированные/архивные: {blockedCount}
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
            {filterOptions.map((option) => {
              const isActive = filterStatus === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilterStatus(option.value)}
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

      {partnersQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить партнёров: {partnersQuery.error.message}
        </div>
      )}

      {partnersQuery.isLoading ? (
        <LoadingPartners />
      ) : partners.length === 0 ? (
        <EmptyPartners
          filterStatus={filterStatus}
          onReset={() => setFilterStatus("all")}
        />
      ) : (
        <section className="grid gap-4">
          {partners.map((partner, index) => {
            const isBusy = busyPartnerId === partner.id;
            const reasonValue = reasonByPartnerId[partner.id] ?? "";
            const selectedAction = actionByPartnerId[partner.id];

            return (
              <div
                key={partner.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <PartnerCard
                  partner={partner}
                  isBusy={isBusy}
                  selectedAction={selectedAction}
                  reasonValue={reasonValue}
                  onSelectAction={(action) =>
                    setActionByPartnerId((current) => ({
                      ...current,
                      [partner.id]: action,
                    }))
                  }
                  onReasonChange={(value) =>
                    setReasonByPartnerId((current) => ({
                      ...current,
                      [partner.id]: value,
                    }))
                  }
                  onAction={(action) => {
                    void runAction(partner.id, action);
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