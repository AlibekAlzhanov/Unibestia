"use client";

import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
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

function CatalogOfferCard({ offer }: { offer: OfferCard }): JSX.Element {
  return (
    <Link
      href={`/offer/${offer.slug}`}
      className="group overflow-hidden rounded-[28px] border border-[#E5ECE9] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[#FFB5A4]"
    >
      {offer.coverMedia?.fileUrl ? (
        <img
          src={offer.coverMedia.fileUrl}
          alt={offer.title}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#17384B] to-[#FF9F8A] text-sm font-black uppercase tracking-[0.22em] text-white">
          UniBestia
        </div>
      )}

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            {offer.partner?.logoUrl ? (
              <img
                src={offer.partner.logoUrl}
                alt={offer.partner.brandName ?? "Партнёр"}
                className="h-10 w-10 shrink-0 rounded-2xl border border-[#E5ECE9] object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F7F6F1] text-xs font-black text-[#526470]">
                {offer.partner?.brandName?.slice(0, 1).toUpperCase() ?? "P"}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#9CA3AF]">
                {offer.partner?.brandName ?? "Партнёр"}
              </p>
              <h2 className="mt-1 line-clamp-2 text-lg font-bold text-[#17384B]">
                {offer.title}
              </h2>
            </div>
          </div>

          <span className="shrink-0 rounded-2xl bg-[#FFF0EB] px-3 py-2 text-sm font-extrabold text-[#FF7F6E]">
            {formatBenefit(offer)}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[#6B7280]">
          {offer.shortDescription ?? "Подробности доступны в карточке."}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
            {offer.category?.name ?? "Категория"}
          </span>
          <span className="text-sm font-bold text-[#17384B] group-hover:text-[#FF7F6E]">
            Подробнее →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CatalogPage(): JSX.Element {
  const trpc = useTRPC();
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<
    string | undefined
  >();
  const [search, setSearch] = useState("");

  const categoriesQuery = useQuery(trpc.catalog.listCategories.queryOptions());

  const normalizedSearch = useMemo(() => search.trim(), [search]);

  const offersQuery = useQuery(
    trpc.catalog.listOffers.queryOptions({
      categorySlug: selectedCategorySlug,
      search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
      limit: 24,
      offset: 0,
    })
  );

  const categories = categoriesQuery.data ?? [];
  const offers = offersQuery.data?.items ?? [];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Каталог UniBestia
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#17384B]">
          Все студенческие скидки
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Выбери предложение, открой карточку и получи QR-код. Для удобного
          использования лучше открыть карточку с телефона или через мобильное
          приложение.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию или описанию"
            className="h-12 flex-1 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none transition focus:border-[#FF9F8A]"
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategorySlug(undefined);
            }}
            className="h-12 rounded-2xl border border-[#D8E3DE] px-5 text-sm font-bold text-[#17384B] transition hover:bg-[#F7F6F1]"
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategorySlug(undefined)}
          className={[
            "rounded-2xl px-4 py-2 text-sm font-bold transition",
            !selectedCategorySlug
              ? "bg-[#17384B] text-white"
              : "bg-white text-[#526470] hover:bg-[#F6F8F7]",
          ].join(" ")}
        >
          Все
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategorySlug(category.slug)}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-bold transition",
              selectedCategorySlug === category.slug
                ? "bg-[#17384B] text-white"
                : "bg-white text-[#526470] hover:bg-[#F6F8F7]",
            ].join(" ")}
          >
            {category.name}
          </button>
        ))}
      </div>

      {offersQuery.isLoading ? (
        <div className="rounded-3xl bg-white p-8 text-[#6B7280]">
          Загружаем скидки...
        </div>
      ) : offersQuery.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
          Не удалось загрузить каталог: {offersQuery.error.message}
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-[#6B7280]">
          По выбранным условиям скидок пока нет.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <CatalogOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
