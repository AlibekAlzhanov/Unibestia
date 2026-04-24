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

type PartnerStatusFilter = "all" | (typeof statuses)[number];

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

export default function AdminPartnersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [filterStatus, setFilterStatus] =
    useState<PartnerStatusFilter>("all");
  const [busyPartnerId, setBusyPartnerId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const partnersQuery = useQuery(
    trpc.business.admin.listPartners.queryOptions({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100,
      offset: 0,
    })
  );

  const partners = partnersQuery.data?.items ?? [];

  async function runAction(
    partnerId: string,
    action: "approve" | "reject" | "suspend"
  ): Promise<void> {
    setBusyPartnerId(partnerId);
    setMessage(null);
    setError(null);

    try {
      if (action === "approve") {
        await trpcClient.business.admin.approvePartner.mutate({ partnerId });
        setMessage("Партнёр одобрен.");
      }

      if (action === "reject") {
        await trpcClient.business.admin.rejectPartner.mutate({
          partnerId,
          reason: "Rejected by admin",
        });
        setMessage("Партнёр отклонён.");
      }

      if (action === "suspend") {
        await trpcClient.business.admin.suspendPartner.mutate({ partnerId });
        setMessage("Партнёр заблокирован.");
      }

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
          Партнёр подаёт заявку, админ одобряет или отклоняет компанию. После
          одобрения владелец получает доступ к кабинету партнёра.
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

            return (
              <article
                key={partner.id}
                className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
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
                    </div>
                  </div>

                  <div className="grid min-w-[240px] gap-2">
                    <button
                      type="button"
                      onClick={() => runAction(partner.id, "approve")}
                      disabled={isBusy || partner.status === "approved"}
                      className="rounded-2xl bg-[#FF9F8A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(partner.id, "reject")}
                      disabled={isBusy || partner.status === "rejected"}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(partner.id, "suspend")}
                      disabled={isBusy || partner.status === "suspended"}
                      className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-sm font-bold text-[#526470] disabled:opacity-50"
                    >
                      Suspend
                    </button>
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
