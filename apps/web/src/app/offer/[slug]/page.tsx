"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type JSX, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  partner?: {
    id: string;
    brandName: string;
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

function qrImageUrl(qrToken: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrToken
  )}`;
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

  const offerQuery = useQuery(
    trpc.catalog.getOfferBySlug.queryOptions({
      slug: params.slug,
    })
  );

  const profileQuery = useQuery(trpc.profile.getMyProfile.queryOptions());

  const offer = offerQuery.data as OfferDetails | undefined;
  const isAllowedStudentEmail =
    profileQuery.data?.allowedStudentEmailDomain?.isAllowed === true;

  const effectiveLocationId = useMemo(() => {
    if (selectedLocationId) {
      return selectedLocationId;
    }

    return offer?.locations?.[0]?.id;
  }, [offer?.locations, selectedLocationId]);

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
    return (
      <div className="mx-auto min-h-[calc(100vh-72px)] max-w-[1000px] px-4 py-10">
        <div className="rounded-3xl bg-white p-8 text-[#6B7280]">
          Загружаем карточку скидки...
        </div>
      </div>
    );
  }

  if (offerQuery.error || !offer) {
    return (
      <div className="mx-auto min-h-[calc(100vh-72px)] max-w-[1000px] px-4 py-10">
        <div className="rounded-3xl bg-white p-8">
          <h1 className="text-2xl font-bold text-[#17384B]">
            Скидка не найдена
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Возможно, предложение ещё не опубликовано или было отключено.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-bold text-white"
          >
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-8 md:px-6 lg:px-8">
      <Link
        href="/catalog"
        className="mb-5 inline-flex text-sm font-bold text-[#FF7F6E]"
      >
        ← Назад в каталог
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {offer.category && (
              <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
                {offer.category.name}
              </span>
            )}
            {offer.partner && (
              <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-bold text-[#FF7F6E]">
                {offer.partner.brandName}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#17384B] md:text-4xl">
            {offer.title}
          </h1>

          {offer.shortDescription && (
            <p className="mt-4 text-lg leading-8 text-[#526470]">
              {offer.shortDescription}
            </p>
          )}

          <div className="mt-6 rounded-[28px] bg-[#17384B] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB5A4]">
              Выгода
            </p>
            <div className="mt-2 text-5xl font-black">
              {formatBenefit(offer)}
            </div>
            {offer.minPurchaseAmount && (
              <p className="mt-3 text-sm text-[#DDE8EA]">
                Минимальная сумма покупки:{" "}
                {Number(offer.minPurchaseAmount).toFixed(0)} ₸
              </p>
            )}
          </div>

          <div className="mt-7">
            <h2 className="text-xl font-bold text-[#17384B]">Описание</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-[#526470]">
              {offer.description}
            </p>
          </div>

          {offer.terms && (
            <div className="mt-7 rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
              <h2 className="text-lg font-bold text-[#17384B]">Условия</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-[#526470]">
                {offer.terms}
              </p>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-[#17384B]">
              Получить скидку
            </h2>

            {profileQuery.isLoading ? (
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Проверяем студенческий домен...
              </p>
            ) : isAllowedStudentEmail ? (
              <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                Студенческий домен разрешён:{" "}
                {profileQuery.data?.allowedStudentEmailDomain.domain}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
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
              <div className="mt-3 rounded-2xl border border-[#FFE0D8] bg-[#FFF7F4] p-4 text-sm leading-6 text-[#8A4B3F]">
                Кнопка “Получить QR” доступна и на сайте, но для удобного
                использования откройте QR в мобильном приложении или на телефоне.
              </div>
            )}

            {offer.locations.length > 0 && (
              <label className="mt-5 block">
                <span className="text-sm font-bold text-[#17384B]">
                  Точка применения
                </span>
                <select
                  value={effectiveLocationId ?? ""}
                  onChange={(event) => setSelectedLocationId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
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
              className="mt-5 w-full rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f28977] disabled:opacity-60"
            >
              {isCreating ? "Создаём QR..." : "Получить QR"}
            </button>

            {createError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {createError}
              </div>
            )}

            {createdRedemption && (
              <div className="mt-5 rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5 text-center">
                <p className="text-sm font-bold text-[#17384B]">
                  QR-код создан
                </p>
                <img
                  src={qrImageUrl(createdRedemption.qrToken)}
                  alt="QR code"
                  className="mx-auto mt-4 h-[220px] w-[220px] rounded-2xl bg-white p-3"
                />
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

          <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-[#17384B]">Где действует</h2>
            <div className="mt-4 space-y-3">
              {offer.locations.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Локации не указаны.</p>
              ) : (
                offer.locations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-2xl bg-[#F7F6F1] p-4"
                  >
                    <p className="font-bold text-[#17384B]">{location.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {[location.city, location.address].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-[#17384B]">Отзывы</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Средняя оценка:{" "}
              <span className="font-bold text-[#17384B]">
                {offer.stats.averageRating
                  ? offer.stats.averageRating.toFixed(1)
                  : "нет оценок"}
              </span>
            </p>
            <div className="mt-4 space-y-3">
              {offer.reviews.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Отзывов пока нет.</p>
              ) : (
                offer.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-[#E5ECE9] p-4"
                  >
                    <p className="text-sm font-bold text-[#17384B]">
                      Оценка: {review.rating}/5
                    </p>
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
