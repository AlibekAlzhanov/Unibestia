"use client";

import Image from "next/image";
import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type OfferCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
  isFavorite?: boolean | null;
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

type Category = {
  id: string;
  slug: string;
  name: string;
};

type SortMode = "recommended" | "biggest-discount" | "cashback" | "bonus";

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "recommended", label: "Рекомендуемые" },
  { value: "biggest-discount", label: "Больше скидка" },
  { value: "cashback", label: "Cashback" },
  { value: "bonus", label: "Бонусы" },
];

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

function getDiscountScore(offer: OfferCard): number {
  if (offer.discountType === "percent" && offer.discountValue) {
    return Number(offer.discountValue);
  }

  if (offer.discountType === "fixed_amount" && offer.discountValue) {
    return Number(offer.discountValue) / 100;
  }

  return 0;
}

function getCashbackScore(offer: OfferCard): number {
  return offer.cashbackPercent ? Number(offer.cashbackPercent) : 0;
}

function getBonusScore(offer: OfferCard): number {
  return offer.bonusRewardPoints ?? 0;
}

function sortOffers(offers: OfferCard[], sortMode: SortMode): OfferCard[] {
  const copiedOffers = [...offers];

  if (sortMode === "biggest-discount") {
    return copiedOffers.sort((a, b) => getDiscountScore(b) - getDiscountScore(a));
  }

  if (sortMode === "cashback") {
    return copiedOffers.sort((a, b) => getCashbackScore(b) - getCashbackScore(a));
  }

  if (sortMode === "bonus") {
    return copiedOffers.sort((a, b) => getBonusScore(b) - getBonusScore(a));
  }

  return copiedOffers;
}

function CatalogOfferCover({ offer }: { offer: OfferCard }): JSX.Element {
  if (offer.coverMedia?.fileUrl) {
    return (
      <div className="relative h-44 w-full overflow-hidden rounded-[24px] bg-[#F7F6F1]">
        <Image
          src={offer.coverMedia.fileUrl}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="ub-image-lift object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-44 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_45%,#FF9F8A_100%)] text-sm font-black uppercase tracking-[0.22em] text-white">
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
        width={42}
        height={42}
        sizes="42px"
        className="h-[42px] w-[42px] shrink-0 rounded-2xl border border-[#E5ECE9] object-cover"
      />
    );
  }

  return (
    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-[#F7F6F1] text-xs font-black text-[#526470]">
      {offer.partner?.brandName?.slice(0, 1).toUpperCase() ?? "P"}
    </div>
  );
}

function CatalogOfferCard({
  offer,
  isFavorite,
  isToggling,
  onToggleFavorite,
}: {
  offer: OfferCard;
  isFavorite: boolean;
  isToggling: boolean;
  onToggleFavorite: () => void;
}): JSX.Element {
  return (
    <article className="ub-card group relative flex h-full flex-col rounded-[30px] p-5">
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={isToggling}
        aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        className={[
          "absolute right-8 top-8 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-black shadow-[0_12px_24px_rgba(15,23,42,0.14)] backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60",
          isFavorite
            ? "border-[#FFB5A4] bg-[#FFF0EB] text-[#FF7F6E]"
            : "border-white/50 bg-white/85 text-[#526470] hover:bg-[#FFF0EB] hover:text-[#FF7F6E]",
        ].join(" ")}
      >
        {isFavorite ? "♥" : "♡"}
      </button>

      <Link href={`/offer/${offer.slug}`} className="block">
        <CatalogOfferCover offer={offer} />
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <PartnerLogo offer={offer} />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#9CA3AF]">
                {offer.partner?.brandName ?? "Партнёр"}
              </p>

              <Link href={`/offer/${offer.slug}`}>
                <h2 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-[#17384B] transition hover:text-[#FF7F6E]">
                  {offer.title}
                </h2>
              </Link>
            </div>
          </div>

          <span className="shrink-0 rounded-2xl bg-[#FFF0EB] px-3 py-2 text-sm font-black text-[#FF7F6E]">
            {formatBenefit(offer)}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[#6B7280]">
          {offer.shortDescription ?? "Подробности доступны в карточке скидки."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="max-w-[55%] truncate rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
            {offer.category?.name ?? "Категория"}
          </span>

          <Link
            href={`/offer/${offer.slug}`}
            className="shrink-0 text-sm font-black text-[#17384B] transition hover:text-[#FF7F6E]"
          >
            Подробнее →
          </Link>
        </div>
      </div>
    </article>
  );
}

function LoadingCatalogGrid(): JSX.Element {
  return (
    <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="ub-card rounded-[30px] p-5">
          <div className="ub-skeleton h-44 rounded-[24px]" />

          <div className="mt-5 flex items-center gap-3">
            <div className="ub-skeleton h-11 w-11 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="ub-skeleton h-3 w-24 rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
            </div>
          </div>

          <div className="ub-skeleton mt-5 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyCatalogState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <div className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        ₸
      </div>

      <h3 className="mt-5 text-2xl font-black text-[#17384B]">
        {hasFilters ? "Ничего не найдено" : "Скидок пока нет"}
      </h3>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilters
          ? "Попробуй изменить категорию, очистить поиск или выбрать другой тип сортировки."
          : "Когда партнёры опубликуют предложения, они появятся в каталоге."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}

function CatalogErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-red-700">
      <p className="text-sm font-black uppercase tracking-[0.14em]">
        Ошибка загрузки
      </p>

      <p className="mt-2 text-sm leading-6">
        Не удалось загрузить каталог: {message}
      </p>
    </div>
  );
}

export default function CatalogPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<
    string | undefined
  >();
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [togglingOfferId, setTogglingOfferId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);

  const normalizedSearch = useMemo(
    () => debouncedSearch.trim(),
    [debouncedSearch]
  );

  const categoriesQuery = useQuery({
    ...trpc.catalog.listCategories.queryOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const offersQuery = useQuery({
    ...trpc.catalog.listOffers.queryOptions({
      categorySlug: selectedCategorySlug,
      search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
      limit: 24,
      offset: 0,
    }),
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const favoriteIdsQuery = useQuery({
    ...trpc.catalog.getFavoriteOfferIds.queryOptions(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const categories = useMemo(
    () => (categoriesQuery.data ?? []) as Category[],
    [categoriesQuery.data]
  );

  const offers = useMemo(
    () => (offersQuery.data?.items ?? []) as OfferCard[],
    [offersQuery.data?.items]
  );

  const favoriteOfferIds = useMemo(
    () => new Set((favoriteIdsQuery.data ?? []) as string[]),
    [favoriteIdsQuery.data]
  );

  const sortedOffers = useMemo(
    () => sortOffers(offers, sortMode),
    [offers, sortMode]
  );

  const selectedCategory = categories.find(
    (category) => category.slug === selectedCategorySlug
  );

  const hasFilters =
    Boolean(selectedCategorySlug) ||
    normalizedSearch.length > 0 ||
    sortMode !== "recommended";

  function resetFilters(): void {
    setSearch("");
    setSelectedCategorySlug(undefined);
    setSortMode("recommended");
  }

  async function toggleFavorite(offerId: string): Promise<void> {
    setTogglingOfferId(offerId);

    try {
      await trpcClient.catalog.toggleFavorite.mutate({ offerId });
      await favoriteIdsQuery.refetch();
    } finally {
      setTogglingOfferId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-8 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Каталог UniBestia
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Все студенческие скидки в одном месте
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Ищи предложения, сохраняй понравившиеся скидки в избранное и
              открывай карточку, чтобы получить QR-код у партнёра.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/favorites"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Моё избранное
              </Link>

              <Link
                href="/my-redemptions"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Мои QR
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {offersQuery.isLoading ? "..." : sortedOffers.length}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Найдено
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {favoriteIdsQuery.isLoading ? "..." : favoriteOfferIds.size}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Избранное
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="truncate text-2xl font-black">
                {selectedCategory?.name ?? "Все"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Фильтр
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px_auto] lg:items-end">
          <div>
            <label
              htmlFor="catalog-search"
              className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]"
            >
              Поиск
            </label>

            <input
              id="catalog-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название, партнёр или описание..."
              className="h-12 w-full rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </div>

          <div>
            <label
              htmlFor="catalog-sort"
              className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]"
            >
              Сортировка
            </label>

            <select
              id="catalog-sort"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-12 w-full rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 text-sm font-black text-[#17384B] outline-none transition focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-white px-5 text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
          >
            Сбросить
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Категории
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B] md:text-3xl">
              Выбери направление
            </h2>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="self-start rounded-2xl bg-[#FFF0EB] px-4 py-2 text-sm font-black text-[#FF7F6E] transition hover:bg-[#FFE4DC] sm:self-auto"
            >
              Очистить фильтры
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
          <button
            type="button"
            onClick={() => setSelectedCategorySlug(undefined)}
            className={[
              "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
              !selectedCategorySlug
                ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
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
                "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                selectedCategorySlug === category.slug
                  ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                  : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
              ].join(" ")}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Результаты
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B] md:text-3xl">
              {selectedCategory?.name ?? "Все предложения"}
            </h2>
          </div>

          <p className="text-sm font-bold text-[#6B7280]">
            {offersQuery.isFetching && !offersQuery.isLoading
              ? "Обновляем..."
              : `${sortedOffers.length} предложений`}
          </p>
        </div>

        {offersQuery.isLoading ? (
          <LoadingCatalogGrid />
        ) : offersQuery.error ? (
          <CatalogErrorState message={offersQuery.error.message} />
        ) : sortedOffers.length === 0 ? (
          <EmptyCatalogState hasFilters={hasFilters} onReset={resetFilters} />
        ) : (
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedOffers.map((offer, index) => (
              <div
                key={offer.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <CatalogOfferCard
                  offer={offer}
                  isFavorite={favoriteOfferIds.has(offer.id)}
                  isToggling={togglingOfferId === offer.id}
                  onToggleFavorite={() => {
                    void toggleFavorite(offer.id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
