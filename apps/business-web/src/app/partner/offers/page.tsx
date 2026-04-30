"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import { OfferImageUploadButton } from "@/components/media/offer-image-upload-button";

type OfferStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

type OfferStatusFilter = "all" | OfferStatus;

type OfferItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  status: OfferStatus;
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
  createdAt: Date | string;
  publishedAt?: Date | string | null;
  redemptions: {
    total: number;
    used: number;
  };
};

const statusFilters: Array<{ value: OfferStatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "pending_review", label: "На модерации" },
  { value: "approved", label: "Одобрено" },
  { value: "published", label: "Опубликовано" },
  { value: "rejected", label: "Отклонено" },
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
    all: "Все",
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
    draft: "Можно отправить на модерацию.",
    pending_review: "Ожидает проверки администратором.",
    approved: "Одобрено. Админ может опубликовать.",
    published: "Доступно студентам в каталоге.",
    rejected: "Можно исправить и отправить повторно.",
    archived: "Скидка перенесена в архив.",
  };

  return hints[status] ?? "";
}

function statusClassName(status: string): string {
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

function canSubmitForReview(status: string): boolean {
  return status === "draft" || status === "rejected";
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

function EmptyOffers({
  hasFilter,
  onReset,
}: {
  hasFilter: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        %
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Скидок пока нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilter
          ? "По выбранному статусу скидок нет. Можно сбросить фильтр или выбрать другой статус."
          : "Создайте первую скидку, отправьте её на модерацию и после публикации она появится в каталоге студентов."}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
          >
            Показать все
          </button>
        )}

        <Link
          href="/partner/offers/new"
          className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Создать скидку
        </Link>
      </div>
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

function OfferCard({
  offer,
  isBusy,
  getToken,
  onSubmitForReview,
  onUploaded,
}: {
  offer: OfferItem;
  isBusy: boolean;
  getToken: () => Promise<string | null>;
  onSubmitForReview: () => void;
  onUploaded: () => Promise<unknown>;
}): JSX.Element {
  const canSubmit = canSubmitForReview(offer.status);

  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={[
            "rounded-2xl border px-3 py-1 text-xs font-black",
            statusClassName(offer.status),
          ].join(" ")}
        >
          {statusLabel(offer.status)}
        </span>

        <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
          {formatBenefit(offer)}
        </span>
      </div>

      <h2 className="mt-5 line-clamp-2 text-2xl font-black leading-tight text-[#17384B]">
        {offer.title}
      </h2>

      <p className="mt-2 break-all font-mono text-xs font-bold text-[#9CA3AF]">
        /{offer.slug}
      </p>

      <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#6B7280]">
        {offer.shortDescription ?? "Короткое описание скидки не указано."}
      </p>

      <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm leading-6 text-[#526470]">
        <span className="font-black text-[#17384B]">Статус:</span>{" "}
        {statusHint(offer.status)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            QR всего
          </p>

          <p className="mt-1 text-3xl font-black text-[#17384B]">
            {offer.redemptions.total}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Used
          </p>

          <p className="mt-1 text-3xl font-black text-[#17384B]">
            {offer.redemptions.used}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm">
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
      </div>

      <div className="mt-auto grid gap-3 pt-5">
        {canSubmit && (
          <button
            type="button"
            onClick={onSubmitForReview}
            disabled={isBusy}
            className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "Отправляем..." : "Отправить на модерацию"}
          </button>
        )}

        <OfferImageUploadButton
          offerId={offer.id}
          getToken={getToken}
          onUploaded={onUploaded}
        />

        <Link
          href={`/partner/offers/${offer.id}`}
          className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
        >
          Открыть детали
        </Link>
      </div>
    </article>
  );
}

export default function PartnerOffersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { getToken } = useAuth();

  const [statusFilter, setStatusFilter] = useState<OfferStatusFilter>("all");
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offersQuery = useQuery({
    ...trpc.business.partner.listOffers.queryOptions({
      limit: 50,
      offset: 0,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const offers = useMemo(
    () => (offersQuery.data?.items ?? []) as OfferItem[],
    [offersQuery.data?.items]
  );

  const filteredOffers = useMemo(() => {
    if (statusFilter === "all") {
      return offers;
    }

    return offers.filter((offer) => offer.status === statusFilter);
  }, [offers, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: offers.length,
      draft: getStatusCount(offers, "draft"),
      pending: getStatusCount(offers, "pending_review"),
      published: getStatusCount(offers, "published"),
      rejected: getStatusCount(offers, "rejected"),
    };
  }, [offers]);

  async function submitForReview(offerId: string): Promise<void> {
    setBusyOfferId(offerId);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.partner.submitOfferForReview.mutate({
        offerId,
      });

      setMessage("Скидка отправлена на модерацию.");
      await offersQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отправить скидку на модерацию"
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
              Partner / Offers
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Управление скидками
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Создавайте скидки, отправляйте их на модерацию, отслеживайте
              статусы, QR-использования и загружайте изображения предложений.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/partner/offers/new"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Создать скидку
              </Link>

              <Link
                href="/partner/redemptions"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                История QR
              </Link>
            </div>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Всего скидок"
          value={metrics.total}
          hint="все офферы партнёра"
          index={0}
        />

        <MetricCard
          label="Черновики"
          value={metrics.draft}
          hint="можно отправить на модерацию"
          index={1}
        />

        <MetricCard
          label="На модерации"
          value={metrics.pending}
          hint="ожидают решения администратора"
          index={2}
        />

        <MetricCard
          label="Опубликовано"
          value={metrics.published}
          hint="видны студентам в каталоге"
          index={3}
        />
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр статуса
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Показано: {filteredOffers.length} из {offers.length}
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
            {statusFilters.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={[
                    "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                    isActive
                      ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                      : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                  ].join(" ")}
                >
                  {filter.label}
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

      {offersQuery.error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить скидки: {offersQuery.error.message}
        </div>
      )}

      {offersQuery.isLoading && !offersQuery.data ? (
        <LoadingOffers />
      ) : filteredOffers.length === 0 ? (
        <EmptyOffers
          hasFilter={statusFilter !== "all"}
          onReset={() => setStatusFilter("all")}
        />
      ) : (
        <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOffers.map((offer, index) => (
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
                isBusy={busyOfferId === offer.id}
                getToken={getToken}
                onSubmitForReview={() => {
                  void submitForReview(offer.id);
                }}
                onUploaded={() => offersQuery.refetch()}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}