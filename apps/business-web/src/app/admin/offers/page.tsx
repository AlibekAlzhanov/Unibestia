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

type OfferItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  status: OfferStatus;
  benefitType?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
  createdAt: Date | string;
  publishedAt?: Date | string | null;
  partner?: {
    brandName?: string | null;
    status?: string | null;
  } | null;
};

const filterOptions: Array<{ value: OfferStatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "pending_review", label: "На модерации" },
  { value: "approved", label: "Одобрены" },
  { value: "published", label: "Опубликованы" },
  { value: "rejected", label: "Отклонены" },
  { value: "archived", label: "Архив" },
];

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

function statusClass(status: string): string {
  if (status === "published") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending_review") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "approved") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "rejected" || status === "archived") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
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
    approve: "Одобрить",
    publish: "Опубликовать",
    reject: "Отклонить",
    archive: "В архив",
  };

  return labels[action];
}

function actionNeedsReason(action: OfferAction): boolean {
  return action === "reject" || action === "archive";
}

function actionButtonClass(action: OfferAction, isSelected: boolean): string {
  if (action === "publish") {
    return [
      "rounded-2xl px-4 py-3 text-sm font-black transition",
      isSelected
        ? "bg-[#FF7F6E] text-white shadow-[0_12px_24px_rgba(255,127,110,0.2)]"
        : "border border-[#FFD8CE] bg-[#FFF0EB] text-[#FF7F6E] hover:bg-[#FFE4DC]",
    ].join(" ");
  }

  if (action === "approve") {
    return [
      "rounded-2xl px-4 py-3 text-sm font-black transition",
      isSelected
        ? "bg-[#17384B] text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)]"
        : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    ].join(" ");
  }

  if (action === "reject") {
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

function confirmButtonClass(action: OfferAction): string {
  if (action === "publish") {
    return "ub-gradient-button rounded-2xl px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (action === "approve") {
    return "rounded-2xl bg-[#17384B] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-50";
  }

  if (action === "reject") {
    return "rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.16)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "rounded-2xl bg-[#526470] px-4 py-3 text-sm font-black text-white transition hover:bg-[#40515B] disabled:cursor-not-allowed disabled:opacity-50";
}

function reasonPlaceholder(action: OfferAction): string {
  if (action === "reject") {
    return "Причина отказа. Например: неверные условия скидки";
  }

  if (action === "archive") {
    return "Причина архивации. Например: акция завершена";
  }

  return "Причина действия";
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function getStatusCount(offers: OfferItem[], status: OfferStatus): number {
  return offers.filter((offer) => offer.status === status).length;
}

function LoadingOffers(): JSX.Element {
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

function EmptyOffers({
  filterStatus,
  onReset,
}: {
  filterStatus: OfferStatusFilter;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        %
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Скидок с выбранным статусом нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Текущий фильтр:{" "}
        {filterStatus === "all" ? "Все статусы" : statusLabel(filterStatus)}.
        Можно сбросить фильтр или дождаться новых офферов от партнёров.
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

function OfferCard({
  offer,
  isBusy,
  selectedAction,
  reasonValue,
  onSelectAction,
  onReasonChange,
  onAction,
}: {
  offer: OfferItem;
  isBusy: boolean;
  selectedAction?: OfferAction;
  reasonValue: string;
  onSelectAction: (action: OfferAction) => void;
  onReasonChange: (value: string) => void;
  onAction: (action: OfferAction) => void;
}): JSX.Element {
  const actions = getVisibleActions(offer.status);
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
                statusClass(offer.status),
              ].join(" ")}
            >
              {statusLabel(offer.status)}
            </span>

            <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
              {formatBenefit(offer)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              ID: {offer.id.slice(0, 8)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-[#17384B]">
            {offer.title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7280]">
            {offer.shortDescription ?? "Короткое описание не указано."}
          </p>

          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
            {statusHint(offer.status)}
          </p>

          <div className="mt-5 grid gap-3 text-sm text-[#6B7280] md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Партнёр
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {offer.partner?.brandName ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Slug
              </p>
              <p className="mt-1 break-all font-bold text-[#17384B]">
                {offer.slug}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Создано
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(offer.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Опубликовано
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(offer.publishedAt)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Тип выгоды
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {offer.benefitType ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Статус партнёра
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {offer.partner?.status ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <aside className="grid w-full gap-3 xl:w-[320px] xl:shrink-0">
          {actions.length === 0 ? (
            <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm font-bold text-[#6B7280]">
              Доступных действий нет.
            </div>
          ) : (
            <>
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
                      className={actionButtonClass(
                        action,
                        selectedAction === action
                      )}
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
                        placeholder={reasonPlaceholder(selectedAction)}
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
                    {isBusy
                      ? "Обработка..."
                      : `Подтвердить: ${actionLabel(selectedAction)}`}
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </article>
  );
}

export default function AdminOffersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [filterStatus, setFilterStatus] = useState<OfferStatusFilter>("all");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
  const [reasonByOfferId, setReasonByOfferId] = useState<Record<string, string>>(
    {}
  );
  const [actionByOfferId, setActionByOfferId] = useState<
    Record<string, OfferAction | undefined>
  >({});

  const offersQuery = useQuery(
    trpc.business.admin.listOffers.queryOptions({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100,
      offset: 0,
    })
  );

  const offers = useMemo(
    () => (offersQuery.data?.items ?? []) as OfferItem[],
    [offersQuery.data?.items]
  );

  const metrics = useMemo(() => {
    return {
      total: offersQuery.data?.total ?? offers.length,
      pending: getStatusCount(offers, "pending_review"),
      approved: getStatusCount(offers, "approved"),
      published: getStatusCount(offers, "published"),
      rejected: getStatusCount(offers, "rejected"),
    };
  }, [offers, offersQuery.data?.total]);

  function getReason(offerId: string): string | undefined {
    const value = reasonByOfferId[offerId]?.trim();

    if (!value || value.length < 3) {
      return undefined;
    }

    return value;
  }

  async function runAction(offerId: string, action: OfferAction): Promise<void> {
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

      setActionByOfferId((current) => ({
        ...current,
        [offerId]: undefined,
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
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin / Offers
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Модерация скидок
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Проверяйте офферы партнёров, одобряйте, публикуйте или
              архивируйте скидки. Только статус published делает скидку видимой
              в клиентском каталоге.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{metrics.total}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{metrics.pending}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Review
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{metrics.published}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Published
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Всего", metrics.total],
          ["На модерации", metrics.pending],
          ["Одобрено", metrics.approved],
          ["Опубликовано", metrics.published],
          ["Отклонено", metrics.rejected],
        ].map(([label, value], index) => (
          <article
            key={label}
            className={[
              "ub-card rounded-[28px] p-5",
              index === 1 ? "ub-delay-100" : "",
              index === 2 ? "ub-delay-200" : "",
            ].join(" ")}
          >
            <p className="text-sm font-bold text-[#6B7280]">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#17384B]">{value}</p>
          </article>
        ))}
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр статуса
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Найдено: {offersQuery.data?.total ?? 0}
            </h2>
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

      {actionMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      )}

      {offersQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить скидки: {offersQuery.error.message}
        </div>
      )}

      {offersQuery.isLoading ? (
        <LoadingOffers />
      ) : offers.length === 0 ? (
        <EmptyOffers
          filterStatus={filterStatus}
          onReset={() => setFilterStatus("all")}
        />
      ) : (
        <section className="grid gap-4">
          {offers.map((offer, index) => {
            const isBusy = busyOfferId === offer.id;
            const reasonValue = reasonByOfferId[offer.id] ?? "";
            const selectedAction = actionByOfferId[offer.id];

            return (
              <div
                key={offer.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <OfferCard
                  offer={offer}
                  isBusy={isBusy}
                  selectedAction={selectedAction}
                  reasonValue={reasonValue}
                  onSelectAction={(action) =>
                    setActionByOfferId((current) => ({
                      ...current,
                      [offer.id]: action,
                    }))
                  }
                  onReasonChange={(value) =>
                    setReasonByOfferId((current) => ({
                      ...current,
                      [offer.id]: value,
                    }))
                  }
                  onAction={(action) => {
                    void runAction(offer.id, action);
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