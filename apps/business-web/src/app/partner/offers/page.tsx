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

const statusFilters: OfferStatusFilter[] = [
  "all",
  "draft",
  "pending_review",
  "approved",
  "published",
  "rejected",
  "archived",
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
    return "rounded-xl bg-green-50 px-3 py-1 text-xs font-bold text-green-700";
  }

  if (status === "pending_review") {
    return "rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700";
  }

  if (status === "rejected" || status === "archived") {
    return "rounded-xl bg-red-50 px-3 py-1 text-xs font-bold text-red-700";
  }

  if (status === "approved") {
    return "rounded-xl bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700";
  }

  return "rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]";
}

function canSubmitForReview(status: string): boolean {
  return status === "draft" || status === "rejected";
}

export default function PartnerOffersPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { getToken } = useAuth();

  const [statusFilter, setStatusFilter] = useState<OfferStatusFilter>("all");
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offersQuery = useQuery(
    trpc.business.partner.listOffers.queryOptions({
      limit: 50,
      offset: 0,
    })
  );

  const offers = offersQuery.data?.items ?? [];

  const filteredOffers = useMemo(() => {
    if (statusFilter === "all") {
      return offers;
    }

    return offers.filter((offer) => offer.status === statusFilter);
  }, [offers, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: offers.length,
      draft: offers.filter((offer) => offer.status === "draft").length,
      pending: offers.filter((offer) => offer.status === "pending_review")
        .length,
      published: offers.filter((offer) => offer.status === "published").length,
      rejected: offers.filter((offer) => offer.status === "rejected").length,
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
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
              Partner / Offers
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#17384B]">
              Управление скидками
            </h1>
            <p className="mt-3 max-w-2xl text-[#6B7280]">
              Создавайте скидки, отправляйте их на модерацию, отслеживайте
              статус, QR-использования и загружайте фото в R2.
            </p>
          </div>
          <Link
            href="/partner/offers/new"
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
          >
            Создать скидку
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Всего</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.total}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Черновики</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.draft}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">На модерации</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.pending}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Опубликовано</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.published}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#17384B]">Фильтр статуса</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Показано: {filteredOffers.length} из {offers.length}
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as OfferStatusFilter)
            }
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none"
          >
            {statusFilters.map((status) => (
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

      {offersQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить скидки: {offersQuery.error.message}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="hidden grid-cols-[1.3fr_0.5fr_0.7fr_0.4fr_0.4fr_1.2fr] border-b border-[#E5ECE9] bg-[#F9FAF8] px-5 py-4 text-sm font-black text-[#17384B] xl:grid">
          <div>Название</div>
          <div>Выгода</div>
          <div>Статус</div>
          <div>Всего QR</div>
          <div>Used</div>
          <div>Действия</div>
        </div>

        {offersQuery.isLoading ? (
          <div className="p-5 text-sm text-[#6B7280]">Загружаем...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-5 text-sm text-[#6B7280]">
            Скидок с выбранным статусом нет.
          </div>
        ) : (
          filteredOffers.map((offer) => {
            const isBusy = busyOfferId === offer.id;

            return (
              <div
                key={offer.id}
                className="grid gap-4 border-b border-[#E5ECE9] px-5 py-4 text-sm last:border-b-0 xl:grid-cols-[1.3fr_0.5fr_0.7fr_0.4fr_0.4fr_1.2fr]"
              >
                <div>
                  <p className="font-bold text-[#17384B]">{offer.title}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">{offer.slug}</p>
                  <p className="mt-2 text-xs text-[#6B7280]">
                    Создано: {new Date(offer.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="font-bold text-[#FF7F6E]">
                  <span className="mr-2 font-black text-[#17384B] xl:hidden">
                    Выгода:
                  </span>
                  {formatBenefit(offer)}
                </div>

                <div>
                  <span className={statusClassName(offer.status)}>
                    {statusLabel(offer.status)}
                  </span>
                  <p className="mt-2 text-xs text-[#6B7280]">
                    {statusHint(offer.status)}
                  </p>
                </div>

                <div className="font-bold text-[#17384B]">
                  <span className="mr-2 font-black xl:hidden">Всего QR:</span>
                  {offer.redemptions.total}
                </div>

                <div className="font-bold text-[#17384B]">
                  <span className="mr-2 font-black xl:hidden">Used:</span>
                  {offer.redemptions.used}
                </div>

                <div className="grid gap-2">
                  {canSubmitForReview(offer.status) && (
                    <button
                      type="button"
                      onClick={() => submitForReview(offer.id)}
                      disabled={isBusy}
                      className="rounded-2xl bg-[#FF9F8A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {isBusy ? "Отправляем..." : "Отправить на модерацию"}
                    </button>
                  )}

                  <OfferImageUploadButton
                    offerId={offer.id}
                    getToken={getToken}
                    onUploaded={() => offersQuery.refetch()}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}