"use client";

import Image from "next/image";
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

const quickCategories = [
  "Все",
  "Кафе",
  "Фастфуд",
  "Книги",
  "Техника",
  "Образование",
  "Сервисы",
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

function getUniqueOffers(offers: OfferCard[]): OfferCard[] {
  const seen = new Set<string>();

  return offers.filter((offer) => {
    if (seen.has(offer.id)) {
      return false;
    }

    seen.add(offer.id);
    return true;
  });
}

function matchesFilters(
  offer: OfferCard,
  selectedCategory: string,
  searchQuery: string
): boolean {
  const categoryMatches =
    selectedCategory === "Все" ||
    offer.category?.name?.toLowerCase() === selectedCategory.toLowerCase();

  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return categoryMatches;
  }

  const searchableText = [
    offer.title,
    offer.shortDescription,
    offer.partner?.brandName,
    offer.category?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return categoryMatches && searchableText.includes(normalizedQuery);
}

function OfferCover({ offer }: { offer: OfferCard }): JSX.Element {
  if (offer.coverMedia?.fileUrl) {
    return (
      <div className="relative mb-4 h-44 overflow-hidden rounded-[24px] bg-[#F7F6F1]">
        <Image
          src={offer.coverMedia.fileUrl}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="ub-image-lift object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/32 to-transparent" />
      </div>
    );
  }

  return (
    <div className="mb-4 flex h-44 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_45%,#FF9F8A_100%)] text-center text-sm font-black uppercase tracking-[0.22em] text-white">
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
        className="h-[42px] w-[42px] rounded-2xl border border-[#E5ECE9] object-cover"
      />
    );
  }

  return (
    <div className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl bg-[#F7F6F1] text-xs font-black text-[#526470]">
      {offer.partner?.brandName?.slice(0, 1).toUpperCase() ?? "P"}
    </div>
  );
}

function OfferCardView({ offer }: { offer: OfferCard }): JSX.Element {
  return (
    <Link
      href={`/offer/${offer.slug}`}
      className="ub-card group flex h-full flex-col rounded-[30px] p-5"
    >
      <OfferCover offer={offer} />

      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <PartnerLogo offer={offer} />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#9CA3AF]">
                {offer.partner?.brandName ?? "Партнёр"}
              </p>

              <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-[#17384B]">
                {offer.title}
              </h3>
            </div>
          </div>

          <span className="shrink-0 rounded-2xl bg-[#FFF0EB] px-3 py-2 text-sm font-black text-[#FF7F6E]">
            {formatBenefit(offer)}
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-[#6B7280]">
          {offer.shortDescription ?? "Подробности скидки доступны в карточке."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="max-w-[55%] truncate rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
            {offer.category?.name ?? "Категория"}
          </span>

          <span className="shrink-0 text-sm font-black text-[#17384B] transition group-hover:text-[#FF7F6E]">
            Смотреть →
          </span>
        </div>
      </div>
    </Link>
  );
}
function LoadingOfferGrid(): JSX.Element {
  return (
    <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="ub-card rounded-[30px] p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        ₸
      </div>

      <h3 className="mt-5 text-xl font-black text-[#17384B]">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
        {description}
      </p>

      <Link
        href="/catalog"
        className="ub-gradient-button mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black text-white"
      >
        Перейти в каталог
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-red-700">
      <p className="text-sm font-black uppercase tracking-[0.14em]">
        Ошибка загрузки
      </p>

      <p className="mt-2 text-sm leading-6">
        Не удалось загрузить предложения: {message}
      </p>
    </div>
  );
}

export default function HomePage(): JSX.Element {
  const trpc = useTRPC();

  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const homeOffersQuery = useQuery({
    ...trpc.catalog.getHomeOffers.queryOptions(),
    staleTime: 60 * 1000,
  });

  const featuredOffers = useMemo(
    () => homeOffersQuery.data?.featuredOffers ?? [],
    [homeOffersQuery.data?.featuredOffers]
  );

  const newOffers = useMemo(
    () => homeOffersQuery.data?.newOffers ?? [],
    [homeOffersQuery.data?.newOffers]
  );

  const allOffers = useMemo(
    () => getUniqueOffers([...featuredOffers, ...newOffers]),
    [featuredOffers, newOffers]
  );
  const filteredFeaturedOffers = useMemo(
    () =>
      featuredOffers.filter((offer) =>
        matchesFilters(offer, selectedCategory, searchQuery)
      ),
    [featuredOffers, selectedCategory, searchQuery]
  );

  const filteredNewOffers = useMemo(
    () =>
      newOffers.filter((offer) =>
        matchesFilters(offer, selectedCategory, searchQuery)
      ),
    [newOffers, selectedCategory, searchQuery]
  );

  const totalOffers = allOffers.length;
  const partnerCount = new Set(
    allOffers.map((offer) => offer.partner?.id ?? offer.partner?.brandName)
  ).size;
  const categoryCount = new Set(
    allOffers.map((offer) => offer.category?.name).filter(Boolean)
  ).size;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-8 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              UniBestia
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Студенческие скидки, бонусы и предложения рядом с тобой
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Выбирай скидку, получай QR-код и показывай его сотруднику
              партнёра. На компьютере сайт работает как витрина и личный
              кабинет, а основной быстрый сценарий удобно использовать с
              телефона.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/catalog"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Перейти в каталог
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
              <p className="text-2xl font-black">{totalOffers}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Скидок
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{partnerCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Партнёров
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{categoryCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Категорий
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/86 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <label
              htmlFor="offer-search"
              className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]"
            >
              Быстрый поиск
            </label>

            <input
              id="offer-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Найти скидку, партнёра или категорию..."
              className="h-12 w-full rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickCategories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={[
                    "rounded-2xl px-4 py-3 text-sm font-black transition",
                    isActive
                      ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                      : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                  ].join(" ")}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Популярное
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B] md:text-3xl">
              Рекомендуемые скидки
            </h2>
          </div>

          <Link href="/catalog" className="text-sm font-black text-[#FF7F6E]">
            Все скидки →
          </Link>
        </div>

        {homeOffersQuery.isLoading ? (
          <LoadingOfferGrid />
        ) : homeOffersQuery.error ? (
          <ErrorState message={homeOffersQuery.error.message} />
        ) : filteredFeaturedOffers.length === 0 ? (
          <EmptyState
            title="Рекомендаций пока нет"
            description="Попробуй изменить фильтр или перейти в полный каталог предложений."
          />
        ) : (
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFeaturedOffers.map((offer, index) => (
              <div
                key={offer.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <OfferCardView offer={offer} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Новое
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B] md:text-3xl">
            Новые предложения
          </h2>
        </div>

        {homeOffersQuery.isLoading ? (
          <LoadingOfferGrid />
        ) : homeOffersQuery.error ? (
          <ErrorState message={homeOffersQuery.error.message} />
        ) : filteredNewOffers.length === 0 ? (
          <EmptyState
            title="Новых скидок пока нет"
            description="Когда партнёры опубликуют предложения, они появятся в этом разделе."
          />
        ) : (
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNewOffers.map((offer, index) => (
              <div
                key={offer.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <OfferCardView offer={offer} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}