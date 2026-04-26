"use client";

import { type JSX, useState } from "react";
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

  return "Причина";
}

function shouldShowReason(status: string): boolean {
  return status !== "archived";
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
    approve: "Approve",
    reject: "Reject",
    suspend: "Suspend",
    restore: "Restore",
    archive: "Archive",
  };

  return labels[action];
}

function actionClassName(action: PartnerAction): string {
  if (action === "approve" || action === "restore") {
    return "rounded-2xl bg-[#FF9F8A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
  }

  if (action === "reject" || action === "archive") {
    return "rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50";
  }

  return "rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-sm font-bold text-[#526470] disabled:opacity-50";
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

  const partnersQuery = useQuery(
    trpc.business.admin.listPartners.queryOptions({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100,
      offset: 0,
    })
  );

  const partners = partnersQuery.data?.items ?? [];

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
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Partners
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Модерация партнёров
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Партнёр подаёт заявку, админ одобряет, отклоняет, блокирует,
          восстанавливает или архивирует компанию. Все действия фиксируются в
          audit_logs.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#17384B]">Фильтр статуса</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Всего найдено: {partnersQuery.data?.total ?? 0}
            </p>
          </div>

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as PartnerStatusFilter)
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

      {partnersQuery.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить партнёров: {partnersQuery.error.message}
        </div>
      )}

      <section className="mt-6 grid gap-4">
        {partnersQuery.isLoading ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Загружаем партнёров...
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Партнёров с выбранным статусом нет.
          </div>
        ) : (
          partners.map((partner) => {
            const isBusy = busyPartnerId === partner.id;
            const actions = getVisibleActions(partner.status as PartnerStatus);
            const reasonValue = reasonByPartnerId[partner.id] ?? "";

            return (
              <article
                key={partner.id}
                className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
                        {statusLabel(partner.status)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-black text-[#17384B]">
                      {partner.brandName}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                      {partner.legalName}
                    </p>

                    {partner.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B7280]">
                        {partner.description}
                      </p>
                    )}

                    {partner.rejectionReason && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <span className="font-black">Причина:</span>{" "}
                        {partner.rejectionReason}
                      </div>
                    )}

                    <div className="mt-4 grid gap-2 text-sm text-[#6B7280] md:grid-cols-2">
                      <p>
                        <span className="font-bold text-[#17384B]">Email:</span>{" "}
                        {partner.contactEmail}
                      </p>

                      <p>
                        <span className="font-bold text-[#17384B]">Phone:</span>{" "}
                        {partner.contactPhone ?? "—"}
                      </p>

                      <p>
                        <span className="font-bold text-[#17384B]">Owner:</span>{" "}
                        {partner.owner?.displayName ??
                          partner.owner?.email ??
                          "—"}
                      </p>

                      <p>
                        <span className="font-bold text-[#17384B]">
                          Created:
                        </span>{" "}
                        {new Date(partner.createdAt).toLocaleString()}
                      </p>

                      <p>
                        <span className="font-bold text-[#17384B]">
                          Approved:
                        </span>{" "}
                        {partner.approvedAt
                          ? new Date(partner.approvedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-[280px] gap-3">
                    {shouldShowReason(partner.status) && (
                      <textarea
                        value={reasonValue}
                        onChange={(event) =>
                          setReasonByPartnerId((current) => ({
                            ...current,
                            [partner.id]: event.target.value,
                          }))
                        }
                        placeholder={getReasonPlaceholder(
                          actions.includes("reject")
                            ? "reject"
                            : actions.includes("suspend")
                              ? "suspend"
                              : "archive"
                        )}
                        className="min-h-[88px] rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] p-3 text-sm text-[#17384B] outline-none transition focus:border-[#FFB5A4]"
                      />
                    )}

                    <div className="grid gap-2">
                      {actions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => runAction(partner.id, action)}
                          disabled={isBusy}
                          className={actionClassName(action)}
                        >
                          {isBusy ? "Processing..." : actionLabel(action)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}