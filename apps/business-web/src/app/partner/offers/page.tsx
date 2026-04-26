"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { OfferImageUploadButton } from "@/components/media/offer-image-upload-button";

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

export default function PartnerOffersPage(): JSX.Element {
  const trpc = useTRPC();
  const { getToken } = useAuth();
  const offersQuery = useQuery(
    trpc.business.partner.listOffers.queryOptions({
      limit: 50,
      offset: 0,
    })
  );

  const offers = offersQuery.data?.items ?? [];

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
              Список скидок партнёра подключён к backend. Фото скидки можно
              загрузить в R2 прямо из таблицы.
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

      {offersQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить скидки: {offersQuery.error.message}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="hidden grid-cols-[1.3fr_0.5fr_0.6fr_0.4fr_0.4fr_1fr] border-b border-[#E5ECE9] bg-[#F9FAF8] px-5 py-4 text-sm font-black text-[#17384B] xl:grid">
          <div>Название</div>
          <div>Выгода</div>
          <div>Статус</div>
          <div>Всего QR</div>
          <div>Used</div>
          <div>Фото</div>
        </div>

        {offersQuery.isLoading ? (
          <div className="p-5 text-sm text-[#6B7280]">Загружаем...</div>
        ) : offers.length === 0 ? (
          <div className="p-5 text-sm text-[#6B7280]">
            У партнёра пока нет скидок.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="grid gap-4 border-b border-[#E5ECE9] px-5 py-4 text-sm last:border-b-0 xl:grid-cols-[1.3fr_0.5fr_0.6fr_0.4fr_0.4fr_1fr]"
            >
              <div>
                <p className="font-bold text-[#17384B]">{offer.title}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">{offer.slug}</p>
              </div>

              <div className="font-bold text-[#FF7F6E]">
                <span className="mr-2 font-black text-[#17384B] xl:hidden">
                  Выгода:
                </span>
                {formatBenefit(offer)}
              </div>

              <div>
                <span className="rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
                  {offer.status}
                </span>
              </div>

              <div className="font-bold text-[#17384B]">
                <span className="mr-2 font-black xl:hidden">Всего QR:</span>
                {offer.redemptions.total}
              </div>

              <div className="font-bold text-[#17384B]">
                <span className="mr-2 font-black xl:hidden">Used:</span>
                {offer.redemptions.used}
              </div>

              <OfferImageUploadButton
                offerId={offer.id}
                getToken={getToken}
                onUploaded={() => offersQuery.refetch()}
              />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
