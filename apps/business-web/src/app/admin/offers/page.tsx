"use client";

import { type JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

const statuses = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "rejected",
  "archived",
] as const;

type OfferStatusFilter = "all" | (typeof statuses)[number];

function formatBenefit(offer: {
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
}): string {
  if (offer.discountType === "percent" && offer.discountValue) {
    return `-${Number(offer.discountValue).toFixed(0)}%`;
  }

  if (offer.discountType === "fixed_amount" && offer.discountValue) {
    return `-${Number(offer.discountValue).toFixed(0)} ₸`;
  }

  if (offer.cashbackPercent) {
    return `${Number(offer.cashbackPercent).toFixed(0)}% cashback`;
  }

  if (offer.bonusRewardPoints) {
    return `+${offer.bonusRewardPoints} бонусов`;
  }

  return "—";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Черновик",
    pending_review: "На модерации",
    approved: "Одобрено",
    published: "Опубликовано",
    rejected: "Отклонено",
    archived: "Архив",
  };

  return labels[status] ?? status;
}

export default function AdminOffersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [filterStatus, setFilterStatus] = useState<OfferStatusFilter>("all");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  const offersQuery = useQuery(
    trpc.business.admin.listOffers.queryOptions({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100,
      offset: 0,
    })
  );

  const offers = offersQuery.data?.items ?? [];

  async function runAction(
    offerId: string,
    action: "approve" | "publish" | "reject" | "archive"
  ): Promise<void> {
    setBusyOfferId(offerId);
    setActionMessage(null);
    setActionError(null);

    try {
      if (action === "approve") {
        await trpcClient.business.admin.approveOffer.mutate({ offerId });
        setActionMessage("Скидка одобрена.");
      }

      if (action === "publish") {
        await trpcClient.business.admin.publishOffer.mutate({ offerId });
        setActionMessage("Скидка опубликована и теперь видна студентам.");
      }

      if (action === "reject") {
        await trpcClient.business.admin.rejectOffer.mutate({ offerId });
        setActionMessage("Скидка отклонена.");
      }

      if (action === "archive") {
        await trpcClient.business.admin.archiveOffer.mutate({ offerId });
        setActionMessage("Скидка перенесена в архив.");
      }

      await offersQuery.refetch();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось выполнить действие"
      );
    } finally {
      setBusyOfferId(null);
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Offers
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Модерация скидок
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Здесь админ проверяет скидки партнёров. Только статус{" "}
          <span className="font-bold text-[#17384B]">published</span> делает
          скидку видимой в клиентском каталоге.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#17384B]">Фильтр статуса</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Всего найдено: {offersQuery.data?.total ?? 0}
            </p>
          </div>

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as OfferStatusFilter)
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

      {actionMessage && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {offersQuery.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить скидки: {offersQuery.error.message}
        </div>
      )}

      <section className="mt-6 grid gap-4">
        {offersQuery.isLoading ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Загружаем скидки...
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Скидок с выбранным статусом нет.
          </div>
        ) : (
          offers.map((offer) => {
            const isBusy = busyOfferId === offer.id;

            return (
              <article
                key={offer.id}
                className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
                        {statusLabel(offer.status)}
                      </span>
                      <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
                        {formatBenefit(offer)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-black text-[#17384B]">
                      {offer.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                      {offer.shortDescription ?? "Короткое описание не указано."}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-[#6B7280] md:grid-cols-2">
                      <p>
                        <span className="font-bold text-[#17384B]">
                          Партнёр:
                        </span>{" "}
                        {offer.partner?.brandName ?? "—"}
                      </p>
                      <p>
                        <span className="font-bold text-[#17384B]">Slug:</span>{" "}
                        {offer.slug}
                      </p>
                      <p>
                        <span className="font-bold text-[#17384B]">
                          Создано:
                        </span>{" "}
                        {new Date(offer.createdAt).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-bold text-[#17384B]">
                          Опубликовано:
                        </span>{" "}
                        {offer.publishedAt
                          ? new Date(offer.publishedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-[260px] gap-2">
                    <button
                      type="button"
                      onClick={() => runAction(offer.id, "approve")}
                      disabled={isBusy || offer.status === "approved"}
                      className="rounded-2xl border border-[#D8E3DE] px-4 py-2 text-sm font-bold text-[#17384B] disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(offer.id, "publish")}
                      disabled={isBusy || offer.status === "published"}
                      className="rounded-2xl bg-[#FF9F8A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(offer.id, "reject")}
                      disabled={isBusy || offer.status === "rejected"}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(offer.id, "archive")}
                      disabled={isBusy || offer.status === "archived"}
                      className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-sm font-bold text-[#526470] disabled:opacity-50"
                    >
                      Archive
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
