"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type JSX, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocalQrCode } from "@/components/local-qr-code";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type CreatedRedemption = {
  id: string;
  status: string;
  qrToken: string;
  qrExpiresAt: Date | string | null;
  createdAt: Date | string;
};

type OfferDetails = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  terms?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
  minPurchaseAmount?: string | null;
  media: Array<{
    id: string;
    mediaType: string;
    fileUrl: string;
    sortOrder: number;
    isCover: boolean;
  }>;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  partner?: {
    id: string;
    brandName: string;
    description?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    websiteUrl?: string | null;
    instagramUrl?: string | null;
    logoUrl?: string | null;
  } | null;
  locations: Array<{
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    text?: string | null;
  }>;
  stats: {
    reviewCount: number;
    averageRating: number | null;
  };
};

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

  return "Скидка";
}

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setIsMobile(query.matches);
    };

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  return isMobile;
}

function LoadingOfferDetails(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1120px] flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      <div className="ub-skeleton h-5 w-40 rounded-full" />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="ub-card rounded-[34px] p-5">
          <div className="ub-skeleton h-72 rounded-[28px] md:h-96" />
          <div className="mt-6 space-y-3">
            <div className="ub-skeleton h-4 w-40 rounded-full" />
            <div className="ub-skeleton h-8 w-4/5 rounded-full" />
            <div className="ub-skeleton h-4 w-full rounded-full" />
            <div className="ub-skeleton h-4 w-2/3 rounded-full" />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="ub-card rounded-[30px] p-6">
            <div className="ub-skeleton h-16 w-16 rounded-3xl" />
            <div className="ub-skeleton mt-4 h-5 w-3/4 rounded-full" />
            <div className="ub-skeleton mt-3 h-4 w-full rounded-full" />
          </div>

          <div className="ub-card rounded-[30px] p-6">
            <div className="ub-skeleton h-6 w-1/2 rounded-full" />
            <div className="ub-skeleton mt-5 h-12 w-full rounded-2xl" />
            <div className="ub-skeleton mt-4 h-40 w-full rounded-[24px]" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function NotFoundOfferState(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] max-w-[1000px] px-4 py-10">
      <div className="ub-card rounded-[34px] p-8 text-center md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
          !
        </div>

        <h1 className="mt-5 text-2xl font-black text-[#17384B]">
          Скидка не найдена
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
          Возможно, предложение ещё не опубликовано, было отключено или ссылка
          устарела.
        </p>

        <Link
          href="/catalog"
          className="ub-gradient-button mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Вернуться в каталог
        </Link>
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number | null }): JSX.Element {
  const safeRating = rating ?? 0;
  const roundedRating = Math.round(safeRating);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={[
            "text-lg",
            index < roundedRating ? "text-[#FF9F8A]" : "text-[#D8E3DE]",
          ].join(" ")}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function OfferDetailsPage(): JSX.Element {
  const params = useParams<{ slug: string }>();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const isMobile = useIsMobileViewport();

  const [createdRedemption, setCreatedRedemption] =
    useState<CreatedRedemption | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >();

  const offerQuery = useQuery({
    ...trpc.catalog.getOfferBySlug.queryOptions({
      slug: params.slug,
    }),
    staleTime: 60 * 1000,
  });

  const profileQuery = useQuery({
    ...trpc.profile.getMyProfile.queryOptions(),
    enabled: Boolean(offerQuery.data),
    staleTime: 5 * 60 * 1000,
  });

  const offer = offerQuery.data as OfferDetails | undefined;
  const isAllowedStudentEmail =
    profileQuery.data?.allowedStudentEmailDomain?.isAllowed === true;

  const coverMedia = useMemo(() => {
    const media = offer?.media ?? [];
    return media.find((item) => item.isCover) ?? media[0] ?? null;
  }, [offer?.media]);

  const galleryMedia = useMemo(() => {
    const media = offer?.media ?? [];

    return coverMedia
      ? media.filter((item) => item.id !== coverMedia.id)
      : media.slice(1);
  }, [coverMedia, offer?.media]);

  const effectiveLocationId = useMemo(() => {
    if (selectedLocationId) {
      return selectedLocationId;
    }

    return offer?.locations?.[0]?.id;
  }, [offer?.locations, selectedLocationId]);

  const minPurchaseText = offer?.minPurchaseAmount
    ? `${Number(offer.minPurchaseAmount).toFixed(0)} ₸`
    : "Без минимума";

  async function createQr(): Promise<void> {
    if (!offer) return;

    if (!isAllowedStudentEmail) {
      setCreateError(
        "QR доступен только для аккаунта со студенческой почтой разрешённого домена."
      );
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreatedRedemption(null);

    try {
      const response = await trpcClient.redemptions.create.mutate({
        offerId: offer.id,
        locationId: effectiveLocationId,
      });

      setCreatedRedemption(response as CreatedRedemption);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Не удалось получить QR-код"
      );
    } finally {
      setIsCreating(false);
    }
  }

  if (offerQuery.isLoading) {
    return <LoadingOfferDetails />;
  }

  if (offerQuery.error || !offer) {
    return <NotFoundOfferState />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <Link
        href="/catalog"
        className="inline-flex w-fit items-center rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#FF7F6E] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:bg-[#FFF0EB]"
      >
        ← Назад в каталог
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
        <section className="ub-animate-fade-up overflow-hidden rounded-[36px] border border-[#E5ECE9] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="relative">
            {coverMedia?.fileUrl ? (
              <div className="relative h-72 w-full overflow-hidden bg-[#F7F6F1] md:h-[440px]">
                <Image
                  src={coverMedia.fileUrl}
                  alt={offer.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center bg-[linear-gradient(135deg,#17384B_0%,#255B73_45%,#FF9F8A_100%)] text-center text-sm font-black uppercase tracking-[0.24em] text-white md:h-[440px]">
                UniBestia Offer
              </div>
            )}

            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-2">
              {offer.category && (
                <span className="rounded-2xl border border-white/20 bg-white/90 px-3 py-1 text-xs font-black text-[#17384B] backdrop-blur-md">
                  {offer.category.name}
                </span>
              )}

              {offer.partner && (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/90 px-3 py-1 text-xs font-black text-[#FF7F6E] backdrop-blur-md">
                  {offer.partner.logoUrl && (
                    <Image
                      src={offer.partner.logoUrl}
                      alt={offer.partner.brandName}
                      width={20}
                      height={20}
                      sizes="20px"
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  {offer.partner.brandName}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-start">
              <div>
                <h1 className="text-[30px] font-black leading-tight tracking-[-0.04em] text-[#17384B] md:text-4xl">
                  {offer.title}
                </h1>

                {offer.shortDescription && (
                  <p className="mt-4 text-base leading-8 text-[#526470] md:text-lg">
                    {offer.shortDescription}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_58%,#FF9F8A_150%)] p-5 text-white shadow-[0_18px_42px_rgba(23,56,75,0.2)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFB5A4]">
                  Выгода
                </p>

                <div className="mt-2 text-4xl font-black">
                  {formatBenefit(offer)}
                </div>

                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                  Минимум: {minPurchaseText}
                </p>
              </div>
            </div>

            {galleryMedia.length > 0 && (
              <div className="mt-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                      Галерея
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                      Фото предложения
                    </h2>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {galleryMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group relative h-44 w-full overflow-hidden rounded-[24px] bg-[#F7F6F1]"
                    >
                      <Image
                        src={item.fileUrl}
                        alt={offer.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="ub-image-lift object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Описание
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#526470]">
                  {offer.description || "Описание предложения пока не указано."}
                </p>
              </div>

              <div className="rounded-[28px] border border-[#E5ECE9] bg-[#FFF7F4] p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
                  Условия
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#526470]">
                  {offer.terms ||
                    "Условия использования скидки уточняются у партнёра."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="ub-animate-fade-up ub-delay-100 flex flex-col gap-4 lg:sticky lg:top-[92px]">
          {offer.partner && (
            <div className="ub-card rounded-[30px] p-6">
              <div className="flex items-center gap-4">
                {offer.partner.logoUrl ? (
                  <Image
                    src={offer.partner.logoUrl}
                    alt={offer.partner.brandName}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-16 w-16 rounded-3xl border border-[#E5ECE9] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F7F6F1] text-xl font-black text-[#526470]">
                    {offer.partner.brandName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                    Партнёр
                  </p>

                  <h2 className="truncate text-xl font-black text-[#17384B]">
                    {offer.partner.brandName}
                  </h2>
                </div>
              </div>

              {offer.partner.description && (
                <p className="mt-4 text-sm leading-6 text-[#6B7280]">
                  {offer.partner.description}
                </p>
              )}

              <div className="mt-5 grid gap-2">
                {offer.partner.contactEmail && (
                  <a
                    href={`mailto:${offer.partner.contactEmail}`}
                    className="rounded-2xl bg-[#F7F6F1] px-4 py-3 text-sm font-bold text-[#17384B] transition hover:bg-[#FFF0EB]"
                  >
                    {offer.partner.contactEmail}
                  </a>
                )}

                {offer.partner.websiteUrl && (
                  <a
                    href={offer.partner.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-[#F7F6F1] px-4 py-3 text-sm font-bold text-[#17384B] transition hover:bg-[#FFF0EB]"
                  >
                    Сайт партнёра →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="rounded-[30px] border border-[#E5ECE9] bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FF7F6E]">
                  QR-активация
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Получить скидку
                </h2>
              </div>

              <span className="rounded-2xl bg-[#FFF0EB] px-3 py-2 text-sm font-black text-[#FF7F6E]">
                {formatBenefit(offer)}
              </span>
            </div>

            {profileQuery.isLoading ? (
              <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm leading-6 text-[#6B7280]">
                Проверяем студенческий домен...
              </div>
            ) : isAllowedStudentEmail ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                Студенческий домен разрешён:{" "}
                {profileQuery.data?.allowedStudentEmailDomain.domain}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                QR доступен только студентам с разрешённой студенческой почтой.
                Для Satbayev используйте email{" "}
                <span className="font-mono">name@stud.satbayev.university</span>.
                <Link
                  href="/profile"
                  className="mt-3 block rounded-2xl bg-[#17384B] px-4 py-2 text-center text-sm font-bold text-white"
                >
                  Открыть профиль
                </Link>
              </div>
            )}

            {!isMobile && (
              <div className="mt-4 rounded-2xl border border-[#FFE0D8] bg-[#FFF7F4] p-4 text-sm leading-6 text-[#8A4B3F]">
                QR можно получить на сайте, но удобнее открыть эту страницу на
                телефоне и показать код сотруднику партнёра.
              </div>
            )}

            {offer.locations.length > 0 && (
              <label className="mt-5 block">
                <span className="text-sm font-black text-[#17384B]">
                  Точка применения
                </span>

                <select
                  value={effectiveLocationId ?? ""}
                  onChange={(event) => setSelectedLocationId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                >
                  {offer.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={createQr}
              disabled={isCreating || !isAllowedStudentEmail}
              className="ub-gradient-button mt-5 w-full rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Создаём QR..." : "Получить QR"}
            </button>

            {createError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {createError}
              </div>
            )}

            {createdRedemption && (
              <div className="mt-5 rounded-[26px] border border-[#E5ECE9] bg-[#F9FAF8] p-5 text-center">
                <p className="text-sm font-black text-[#17384B]">
                  QR-код создан
                </p>

                <div className="mt-4 rounded-[24px] bg-white p-4">
                  <LocalQrCode value={createdRedemption.qrToken} />
                </div>

                <p className="mt-4 break-all rounded-2xl bg-white px-3 py-2 font-mono text-xs font-bold text-[#526470]">
                  {createdRedemption.qrToken}
                </p>

                <p className="mt-2 text-xs text-[#6B7280]">
                  Действует до:{" "}
                  {createdRedemption.qrExpiresAt
                    ? new Date(createdRedemption.qrExpiresAt).toLocaleString()
                    : "не указано"}
                </p>
              </div>
            )}
          </div>

          <div className="ub-card rounded-[30px] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[#17384B]">
                Где действует
              </h2>

              <span className="rounded-full bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
                {offer.locations.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {offer.locations.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Локации не указаны.</p>
              ) : (
                offer.locations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-2xl bg-[#F7F6F1] p-4"
                  >
                    <p className="font-black text-[#17384B]">{location.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {[location.city, location.address].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ub-card rounded-[30px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#17384B]">Отзывы</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {offer.stats.reviewCount} отзывов
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-[#17384B]">
                  {offer.stats.averageRating
                    ? offer.stats.averageRating.toFixed(1)
                    : "—"}
                </p>
                <RatingStars rating={offer.stats.averageRating} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {offer.reviews.length === 0 ? (
                <p className="rounded-2xl bg-[#F7F6F1] p-4 text-sm text-[#6B7280]">
                  Отзывов пока нет. После первых использований здесь появятся
                  оценки студентов.
                </p>
              ) : (
                offer.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-[#E5ECE9] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-[#17384B]">
                        Оценка: {review.rating}/5
                      </p>
                      <RatingStars rating={review.rating} />
                    </div>

                    {review.text && (
                      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                        {review.text}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}