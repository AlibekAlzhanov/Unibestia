"use client";

import Image from "next/image";
import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type OfferCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
  coverMedia?: {
    id: string;
    mediaType?: string | null;
    fileUrl: string;
    isCover?: boolean | null;
  } | null;
  partner?: {
    id?: string;
    brandName?: string | null;
    logoUrl?: string | null;
  } | null;
  category?: {
    name?: string | null;
  } | null;
};

function formatBenefit(offer: OfferCard): string {
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

  return "Скидка";
}

function OfferCover({ offer }: { offer: OfferCard }): JSX.Element {
  if (offer.coverMedia?.fileUrl) {
    return (
      <div className="relative mb-4 h-44 overflow-hidden rounded-[22px] bg-[#F7F6F1]">
        <Image
          src={offer.coverMedia.fileUrl}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div className="mb-4 flex h-44 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#17384B] to-[#FF9F8A] text-center text-sm font-black uppercase tracking-[0.22em] text-white">
      UniBestia
    </div>
  );
}

function PartnerLogo({ offer }: { offer: OfferCard }): JSX.Element {
  if (offer.partner?.logoUrl) {
    return (
      <Image
        src={offer.partner.logoUrl}
        alt={offer.partner.brandName ?? "Партнёр"}
        width={40}
        height={40}
        sizes="40px"
        className="h-10 w-10 rounded-2xl border border-[#E5ECE9] object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F7F6F1] text-xs font-black text-[#526470]">
      {offer.partner?.brandName?.slice(0, 1).toUpperCase() ?? "P"}
    </div>
  );
}

function OfferCardView({ offer }: { offer: OfferCard }): JSX.Element {
  return (
    <Link
      href={`/offer/${offer.slug}`}
      className="group rounded-[28px] border border-[#E5ECE9] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[#FFB5A4] hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)]"
    >
      <OfferCover offer={offer} />

      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <PartnerLogo offer={offer} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#9CA3AF]">
              {offer.partner?.brandName ?? "Партнёр"}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold text-[#17384B]">
              {offer.title}
            </h3>
          </div>
        </div>

        <span className="shrink-0 rounded-2xl bg-[#FFF0EB] px-3 py-2 text-sm font-extrabold text-[#FF7F6E]">
          {formatBenefit(offer)}
        </span>
      </div>

      <p className="line-clamp-2 text-sm leading-6 text-[#6B7280]">
        {offer.shortDescription ?? "Подробности скидки доступны в карточке."}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
          {offer.category?.name ?? "Категория"}
        </span>
        <span className="text-sm font-bold text-[#17384B] group-hover:text-[#FF7F6E]">
          Смотреть →
        </span>
      </div>
    </Link>
  );
}

export default function HomePage(): JSX.Element {
  const trpc = useTRPC();

  const homeOffersQuery = useQuery({
    ...trpc.catalog.getHomeOffers.queryOptions(),
    staleTime: 60 * 1000,
  });

  const featuredOffers = homeOffersQuery.data?.featuredOffers ?? [];
  const newOffers = homeOffersQuery.data?.newOffers ?? [];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-[#17384B] p-8 text-white shadow-[0_20px_45px_rgba(23,56,75,0.18)] md:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#FFB5A4]">
          UniBestia
        </p>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
          Студенческие скидки, бонусы и предложения рядом с тобой
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#DDE8EA]">
          Выбирай скидку, получай QR-код и показывай его сотруднику партнёра.
          На телефоне это основной сценарий, а на компьютере сайт работает как
          витрина и личный кабинет.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f28977]"
          >
            Перейти в каталог
          </Link>
          <Link
            href="/my-redemptions"
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Мои QR
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              Популярное
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#17384B]">
              Рекомендуемые скидки
            </h2>
          </div>
          <Link href="/catalog" className="text-sm font-bold text-[#FF7F6E]">
            Все скидки →
          </Link>
        </div>

        {homeOffersQuery.isLoading ? (
          <div className="rounded-3xl bg-white p-6 text-[#6B7280]">
            Загружаем предложения...
          </div>
        ) : homeOffersQuery.error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            Не удалось загрузить рекомендации: {homeOffersQuery.error.message}
          </div>
        ) : featuredOffers.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-[#6B7280]">
            Пока нет избранных предложений.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredOffers.map((offer) => (
              <OfferCardView key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
            Новое
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#17384B]">
            Новые предложения
          </h2>
        </div>

        {homeOffersQuery.isLoading ? (
          <div className="rounded-3xl bg-white p-6 text-[#6B7280]">
            Загружаем новые скидки...
          </div>
        ) : homeOffersQuery.error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            Не удалось загрузить новые предложения:{" "}
            {homeOffersQuery.error.message}
          </div>
        ) : newOffers.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-[#6B7280]">
            Пока нет опубликованных скидок.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {newOffers.map((offer) => (
              <OfferCardView key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}