"use client";

import { type JSX, useMemo, useState } from "react";
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

type OfferStatus = (typeof statuses)[number];
type OfferStatusFilter = "all" | OfferStatus;
type OfferAction = "approve" | "publish" | "reject" | "archive";

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
    all: "Все статусы",
    draft: "Черновик",
    pending_review: "На модерации",
    approved: "Одобрено",
    published: "Опубликовано",
    rejected: "Отклонено",
    archived: "Архив",
  };

  return labels[status] ?? status;
}

function statusHint(status: string): string {
  const hints: Record<string, string> = {
    draft: "Партнёр ещё не отправил скидку на модерацию.",
    pending_review: "Скидка ожидает решения администратора.",
    approved: "Скидка одобрена, но ещё не опубликована.",
    published: "Скидка опубликована и доступна студентам.",
    rejected: "Скидка отклонена. Партнёр может отправить её повторно.",
    archived: "Скидка перенесена в архив.",
  };

  return hints[status] ?? "";
}

function statusClassName(status: string): string {
  if (status === "published") {
    return "rounded-2xl bg-green-50 px-3 py-1 text-xs font-black text-green-700";
  }

  if (status === "pending_review") {
    return "rounded-2xl bg-amber-50 px-3 py-1 text-xs font-black text-amber-700";
  }

  if (status === "approved") {
    return "rounded-2xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700";
  }

  if (status === "rejected" || status === "archived") {
    return "rounded-2xl bg-red-50 px-3 py-1 text-xs font-black text-red-700";
  }

  return "rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]";
}

function getVisibleActions(status: OfferStatus): OfferAction[] {
  if (status === "draft") {
    return ["archive"];
  }

  if (status === "pending_review") {
    return ["approve", "publish", "reject", "archive"];
  }

  if (status === "approved") {
    return ["publish", "reject", "archive"];
  }

  if (status === "published") {
    return ["archive"];
  }

  if (status === "rejected") {
    return ["approve", "archive"];
  }

  if (status === "archived") {
    return [];
  }

  return [];
}

function actionLabel(action: OfferAction): string {
  const labels: Record<OfferAction, string> = {
    approve: "Approve",
    publish: "Publish",
    reject: "Reject",
    archive: "Archive",
  };

  return labels[action];
}

function actionClassName(action: OfferAction): string {
  if (action === "publish") {
    return "rounded-2xl bg-[#FF9F8A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
  }

  if (action === "approve") {
    return "rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 disabled:opacity-50";
  }

  if (action === "reject") {
    return "rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50";
  }

  return "rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-sm font-bold text-[#526470] disabled:opacity-50";
}

function reasonPlaceholder(status: string): string {
  if (status === "pending_review" || status === "approved") {
    return "Причина отказа или архивации. Например: неверные условия скидки";
  }

  if (status === "published") {
    return "Причина архивации. Например: акция завершена";
  }

  return "Причина действия";
}

function shouldShowReasonBox(actions: OfferAction[]): boolean {
  return actions.includes("reject") || actions.includes("archive");
}

export default function AdminOffersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [filterStatus, setFilterStatus] = useState<OfferStatusFilter>("all");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
  const [reasonByOfferId, setReasonByOfferId] = useState<
    Record<string, string>
  >({});

  const offersQuery = useQuery(
    trpc.business.admin.listOffers.queryOptions({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100,
      offset: 0,
    })
  );

  const offers = offersQuery.data?.items ?? [];

  const metrics = useMemo(() => {
    return {
      total: offersQuery.data?.total ?? 0,
      pending: offers.filter((offer) => offer.status === "pending_review")
        .length,
      approved: offers.filter((offer) => offer.status === "approved").length,
      published: offers.filter((offer) => offer.status === "published").length,
      rejected: offers.filter((offer) => offer.status === "rejected").length,
    };
  }, [offers, offersQuery.data?.total]);

  function getReason(offerId: string): string | undefined {
    const value = reasonByOfferId[offerId]?.trim();

    if (!value || value.length < 3) {
      return undefined;
    }

    return value;
  }

  async function runAction(
    offerId: string,
    action: OfferAction
  ): Promise<void> {
    setBusyOfferId(offerId);
    setActionMessage(null);
    setActionError(null);

    const reason = getReason(offerId);

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
        await trpcClient.business.admin.rejectOffer.mutate({
          offerId,
          reason,
        });
        setActionMessage("Скидка отклонена.");
      }

      if (action === "archive") {
        await trpcClient.business.admin.archiveOffer.mutate({
          offerId,
          reason,
        });
        setActionMessage("Скидка перенесена в архив.");
      }

      setReasonByOfferId((current) => ({
        ...current,
        [offerId]: "",
      }));

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
          Здесь администратор проверяет скидки партнёров. Только статус{" "}
          <span className="font-bold text-[#17384B]">published</span> делает
          скидку видимой в клиентском каталоге.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Всего</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.total}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">На модерации</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.pending}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Одобрено</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.approved}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Опубликовано</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.published}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Отклонено</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.rejected}
          </p>
        </div>
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
            const actions = getVisibleActions(offer.status as OfferStatus);
            const reasonValue = reasonByOfferId[offer.id] ?? "";

            return (
              <article
                key={offer.id}
                className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusClassName(offer.status)}>
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

                    <p className="mt-2 text-xs font-semibold text-[#9CA3AF]">
                      {statusHint(offer.status)}
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

                      <p>
                        <span className="font-bold text-[#17384B]">
                          Тип выгоды:
                        </span>{" "}
                        {offer.benefitType}
                      </p>

                      <p>
                        <span className="font-bold text-[#17384B]">
                          Статус партнёра:
                        </span>{" "}
                        {offer.partner?.status ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-[280px] gap-3">
                    {shouldShowReasonBox(actions) && (
                      <textarea
                        value={reasonValue}
                        onChange={(event) =>
                          setReasonByOfferId((current) => ({
                            ...current,
                            [offer.id]: event.target.value,
                          }))
                        }
                        placeholder={reasonPlaceholder(offer.status)}
                        className="min-h-[88px] rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] p-3 text-sm text-[#17384B] outline-none transition focus:border-[#FFB5A4]"
                      />
                    )}

                    {actions.length === 0 ? (
                      <div className="rounded-2xl bg-[#F9FAF8] p-4 text-sm font-semibold text-[#6B7280]">
                        Доступных действий нет.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {actions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => runAction(offer.id, action)}
                            disabled={isBusy}
                            className={actionClassName(action)}
                          >
                            {isBusy ? "Processing..." : actionLabel(action)}
                          </button>
                        ))}
                      </div>
                    )}
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