"use client";

import Image from "next/image";
import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type FavoriteOffer = {
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

type FavoritesData = {
  total: number;
  limit: number;
  offset: number;
  items: FavoriteOffer[];
};

function formatBenefit(offer: FavoriteOffer): string {
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

function FavoriteOfferCover({ offer }: { offer: FavoriteOffer }): JSX.Element {
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

function PartnerLogo({ offer }: { offer: FavoriteOffer }): JSX.Element {
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

function FavoriteOfferCard({
  offer,
  isRemoving,
  onRemove,
}: {
  offer: FavoriteOffer;
  isRemoving: boolean;
  onRemove: () => void;
}): JSX.Element {
  return (
    <article className="ub-card group relative flex h-full flex-col rounded-[30px] p-5">
      <button
        type="button"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label="Убрать из избранного"
        className="absolute right-8 top-8 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FFB5A4] bg-[#FFF0EB] text-lg font-black text-[#FF7F6E] shadow-[0_12px_24px_rgba(15,23,42,0.14)] backdrop-blur-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        ♥
      </button>

      <Link href={`/offer/${offer.slug}`} className="block">
        <FavoriteOfferCover offer={offer} />
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

function LoadingFavorites(): JSX.Element {
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

function EmptyFavorites(): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        ♥
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Избранных скидок пока нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Открой каталог и нажми на сердечко в карточке скидки. Сохранённые
        предложения появятся здесь.
      </p>

      <Link
        href="/catalog"
        className="ub-gradient-button mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black text-white"
      >
        Перейти в каталог
      </Link>
    </section>
  );
}

export default function FavoritesPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [removingOfferId, setRemovingOfferId] = useState<string | null>(null);

  const favoritesQuery = useQuery({
    ...trpc.catalog.listFavorites.queryOptions({
      limit: 50,
      offset: 0,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const favoritesData = favoritesQuery.data as FavoritesData | undefined;

  const offers = useMemo(
    () => favoritesData?.items ?? [],
    [favoritesData?.items]
  );

  async function removeFavorite(offerId: string): Promise<void> {
    setRemovingOfferId(offerId);

    try {
      await trpcClient.catalog.toggleFavorite.mutate({ offerId });
      await favoritesQuery.refetch();
    } finally {
      setRemovingOfferId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-8 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <Link
              href="/catalog"
              className="mb-5 inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              ← Назад в каталог
            </Link>

            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Student / Favorites
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Избранные скидки
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Сохраняй интересные предложения, чтобы быстро вернуться к ним
              перед покупкой или посещением партнёра.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">
                {favoritesQuery.isLoading ? "..." : offers.length}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Сохранено
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{favoritesData?.total ?? 0}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>
          </div>
        </div>
      </section>

      {favoritesQuery.error && (
        <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          Не удалось загрузить избранное: {favoritesQuery.error.message}
        </div>
      )}

      {favoritesQuery.isLoading && !favoritesQuery.data ? (
        <LoadingFavorites />
      ) : offers.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              className={[
                "ub-animate-fade-up",
                index === 1 ? "ub-delay-100" : "",
                index === 2 ? "ub-delay-200" : "",
              ].join(" ")}
            >
              <FavoriteOfferCard
                offer={offer}
                isRemoving={removingOfferId === offer.id}
                onRemove={() => {
                  void removeFavorite(offer.id);
                }}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
