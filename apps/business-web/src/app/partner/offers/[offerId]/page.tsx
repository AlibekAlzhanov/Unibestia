"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OfferImageUploadButton } from "@/components/media/offer-image-upload-button";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type OfferStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

type OfferLocationItem = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  isActive?: boolean | null;
  offerLocationId?: string | null;
};

type OfferDetail = {
  id: string;
  partnerId: string;
  categoryId: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description: string;
  terms?: string | null;
  status: OfferStatus;
  benefitType?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  cashbackPercent?: string | null;
  bonusRewardPoints?: number | null;
  minPurchaseAmount?: string | null;
  usageLimitPerUser?: number | null;
  totalUsageLimit?: number | null;
  startAt: Date | string;
  endAt?: Date | string | null;
  isFeatured?: boolean | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  locations: OfferLocationItem[];
};

type ModerationRequestItem = {
  id: string;
  status: string;
  decision: string | null;
  decisionComment: string | null;
  entityType: string;
  entityId: string;
  assignedAdmin: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  resolvedBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  resolvedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type PartnerOfferDetailData = {
  partner: {
    id: string;
    brandName: string;
    status: string;
  };
  offer: OfferDetail;
  redemptionsSummary: {
    total: number;
    created: number;
    confirmed: number;
    used: number;
    expired: number;
    cancelled: number;
  };
  moderationRequests: ModerationRequestItem[];
};

type RedemptionItem = {
  id: string;
  status: string;
  qrToken: string;
  qrExpiresAt?: Date | string | null;
  orderAmount?: string | number | null;
  discountAmount?: string | number | null;
  bonusEarned?: number | null;
  bonusSpent?: number | null;
  usedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  createdAt: Date | string;
  offer: {
    id: string;
    title: string;
    slug: string;
  } | null;
  student: {
    id: string;
    email: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  location: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  } | null;
};

type PartnerRedemptionsData = {
  total: number;
  items: RedemptionItem[];
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

  return "—";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
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
    draft: "Скидка сохранена как черновик. Её можно отправить на модерацию.",
    pending_review: "Скидка ожидает проверки администратора.",
    approved: "Скидка одобрена. Администратор может опубликовать её в каталоге.",
    published: "Скидка опубликована и доступна студентам.",
    rejected: "Скидка отклонена. Исправьте данные и отправьте повторно.",
    archived: "Скидка перенесена в архив и больше не используется.",
  };

  return hints[status] ?? "Статус скидки обновляется через workflow модерации.";
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

function redemptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    created: "Создан",
    confirmed: "Подтверждён",
    used: "Использован",
    expired: "Истёк",
    cancelled: "Отменён",
  };

  return labels[status] ?? status;
}

function redemptionStatusClass(status: string): string {
  if (status === "used" || status === "confirmed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "created") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "expired" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function requestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Ожидает",
    in_review: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
    cancelled: "Отменено",
  };

  return labels[status] ?? status;
}

function requestStatusClass(status: string): string {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending" || status === "in_review") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "rejected" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function requestDecisionLabel(decision?: string | null): string {
  if (!decision) {
    return "Решения пока нет";
  }

  const labels: Record<string, string> = {
    approve: "Одобрено",
    reject: "Отклонено",
    cancel: "Отменено",
  };

  return labels[decision] ?? decision;
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function formatAmount(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return `${Number(value).toLocaleString("ru-RU")} ₸`;
}

function canSubmitForReview(status: string): boolean {
  return status === "draft" || status === "rejected";
}

function getStudentName(item: RedemptionItem): string {
  return (
    item.student?.displayName ||
    `${item.student?.firstName ?? ""} ${item.student?.lastName ?? ""}`.trim() ||
    item.student?.email ||
    "—"
  );
}

function getLocationText(item: RedemptionItem): string {
  if (!item.location) {
    return "—";
  }

  return [item.location.city, item.location.address].filter(Boolean).join(", ");
}

function getOfferLocationText(location: OfferLocationItem): string {
  return [location.city, location.address].filter(Boolean).join(", ") || "—";
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}): JSX.Element {
  return (
    <article className="rounded-[28px] border border-[#E5ECE9] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-bold text-[#6B7280]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#17384B]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{hint}</p>
    </article>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9FAF8] px-4 py-3">
      <span className="text-sm font-bold text-[#526470]">{label}</span>
      <span className="break-all text-right text-sm font-black text-[#17384B]">
        {value}
      </span>
    </div>
  );
}

function LoadingDetail(): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-8 w-44 rounded-full" />
        <div className="ub-skeleton mt-6 h-12 w-2/3 rounded-full" />
        <div className="ub-skeleton mt-5 h-4 w-full rounded-full" />
        <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
      </section>

      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-7 w-32 rounded-full" />
        <div className="ub-skeleton mt-6 h-14 w-full rounded-2xl" />
        <div className="ub-skeleton mt-4 h-14 w-full rounded-2xl" />
      </section>
    </div>
  );
}

function EmptyRedemptions(): JSX.Element {
  return (
    <div className="rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#FFF0EB] text-xl font-black text-[#FF7F6E]">
        QR
      </div>

      <h3 className="mt-4 text-xl font-black text-[#17384B]">
        QR-использований пока нет
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6B7280]">
        Когда студент получит QR по этой скидке, история появится здесь.
      </p>
    </div>
  );
}

function EmptyRequests(): JSX.Element {
  return (
    <div className="rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#FFF0EB] text-xl font-black text-[#FF7F6E]">
        REQ
      </div>

      <h3 className="mt-4 text-xl font-black text-[#17384B]">
        Заявок по скидке нет
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6B7280]">
        Заявка появится после отправки скидки на модерацию.
      </p>
    </div>
  );
}

function RedemptionCard({ item }: { item: RedemptionItem }): JSX.Element {
  return (
    <article className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                redemptionStatusClass(item.status),
              ].join(" ")}
            >
              {redemptionStatusLabel(item.status)}
            </span>

            <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
              {item.bonusEarned ?? 0} bonus
            </span>
          </div>

          <h3 className="mt-3 text-base font-black text-[#17384B]">
            {getStudentName(item)}
          </h3>

          <p className="mt-1 break-all text-sm leading-6 text-[#6B7280]">
            {item.student?.email ?? "email не указан"}
          </p>

          <p className="mt-2 break-all font-mono text-xs text-[#9CA3AF]">
            {item.qrToken}
          </p>
        </div>

        <div className="grid shrink-0 gap-2 text-sm md:w-[220px]">
          <InfoRow label="Сумма" value={formatAmount(item.orderAmount)} />
          <InfoRow label="Скидка" value={formatAmount(item.discountAmount)} />
          <InfoRow label="Used" value={formatDateTime(item.usedAt)} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-[#F9FAF8] p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
          Точка
        </p>

        <p className="mt-1 font-bold text-[#17384B]">
          {item.location?.name ?? "—"}
        </p>

        <p className="mt-1 text-sm leading-6 text-[#6B7280]">
          {getLocationText(item)}
        </p>
      </div>
    </article>
  );
}

function RequestCard({ item }: { item: ModerationRequestItem }): JSX.Element {
  return (
    <article className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                requestStatusClass(item.status),
              ].join(" ")}
            >
              {requestStatusLabel(item.status)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {requestDecisionLabel(item.decision)}
            </span>
          </div>

          <h3 className="mt-3 text-base font-black text-[#17384B]">
            Заявка на модерацию скидки
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Создано: {formatDateTime(item.createdAt)}
          </p>
        </div>

        <div className="grid shrink-0 gap-2 text-sm md:w-[220px]">
          <InfoRow label="Обновлено" value={formatDateTime(item.updatedAt)} />
          <InfoRow label="Решено" value={formatDateTime(item.resolvedAt)} />
        </div>
      </div>

      {item.decisionComment && (
        <div className="mt-4 rounded-2xl border border-[#FFE0D8] bg-[#FFF7F4] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FF7F6E]">
            Комментарий администратора
          </p>

          <p className="mt-2 text-sm leading-7 text-[#8A4B3F]">
            {item.decisionComment}
          </p>
        </div>
      )}
    </article>
  );
}

function LocationCard({ location }: { location: OfferLocationItem }): JSX.Element {
  return (
    <article className="rounded-[22px] border border-[#E5ECE9] bg-[#F9FAF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#17384B]">{location.name}</p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            {getOfferLocationText(location)}
          </p>
        </div>

        <span
          className={[
            "rounded-2xl px-3 py-1 text-xs font-black",
            location.isActive === false
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700",
          ].join(" ")}
        >
          {location.isActive === false ? "inactive" : "active"}
        </span>
      </div>
    </article>
  );
}

export default function PartnerOfferDetailPage(): JSX.Element {
  const params = useParams<{ offerId: string }>();
  const offerId = params.offerId;

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { getToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const offerDetailQuery = useQuery({
    ...trpc.business.partner.getOfferById.queryOptions({
      offerId,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const redemptionsQuery = useQuery({
    ...trpc.business.partner.listRedemptions.queryOptions({
      limit: 100,
      offset: 0,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const detail = offerDetailQuery.data as PartnerOfferDetailData | undefined;
  const redemptionsData = redemptionsQuery.data as
    | PartnerRedemptionsData
    | undefined;

  const offer = detail?.offer ?? null;
  const redemptionsSummary = detail?.redemptionsSummary;
  const moderationRequests = detail?.moderationRequests ?? [];

  const redemptions = useMemo(() => {
    return (redemptionsData?.items ?? []).filter(
      (item) => item.offer?.id === offerId
    );
  }, [offerId, redemptionsData?.items]);

  const totalOrderAmount = redemptions.reduce((sum, item) => {
    return sum + Number(item.orderAmount ?? 0);
  }, 0);

  const totalDiscountAmount = redemptions.reduce((sum, item) => {
    return sum + Number(item.discountAmount ?? 0);
  }, 0);

  const totalBonusEarned = redemptions.reduce((sum, item) => {
    return sum + Number(item.bonusEarned ?? 0);
  }, 0);

  async function submitForReview(): Promise<void> {
    if (!offer) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await trpcClient.business.partner.submitOfferForReview.mutate({
        offerId: offer.id,
      });

      setMessage("Скидка отправлена на модерацию.");
      await offerDetailQuery.refetch();
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отправить скидку на модерацию"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (offerDetailQuery.isLoading && !offerDetailQuery.data) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <LoadingDetail />
      </div>
    );
  }

  if (offerDetailQuery.error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] flex-col justify-center px-4 py-8">
        <section className="rounded-[34px] border border-red-200 bg-red-50 p-8 text-red-700">
          <p className="text-sm font-black uppercase tracking-[0.18em]">
            Ошибка
          </p>

          <h1 className="mt-2 text-3xl font-black">Не удалось загрузить скидку</h1>

          <p className="mt-3 text-sm leading-7">
            {offerDetailQuery.error.message}
          </p>

          <Link
            href="/partner/offers"
            className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-red-700"
          >
            Вернуться к скидкам
          </Link>
        </section>
      </div>
    );
  }

  if (!offer || !redemptionsSummary) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] flex-col justify-center px-4 py-8">
        <section className="ub-card rounded-[34px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
            %
          </div>

          <h1 className="mt-5 text-3xl font-black text-[#17384B]">
            Скидка не найдена
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6B7280]">
            Возможно, скидка была удалена, архивирована или не принадлежит
            текущему партнёру.
          </p>

          <Link
            href="/partner/offers"
            className="ub-gradient-button mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black text-white"
          >
            Вернуться к списку
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <Link
              href="/partner/offers"
              className="mb-5 inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              ← Назад к скидкам
            </Link>

            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Partner / Offer Detail
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              {offer.title}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              {offer.shortDescription ??
                "Детальная карточка скидки: статус, модерация, QR-использования и бизнес-метрики."}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {canSubmitForReview(offer.status) && (
                <button
                  type="button"
                  onClick={() => void submitForReview()}
                  disabled={isSubmitting}
                  className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Отправляем..." : "Отправить на модерацию"}
                </button>
              )}

              <Link
                href="/partner/requests"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Заявки
              </Link>

              <Link
                href="/partner/redemptions"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                История QR
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
              Current status
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={[
                  "rounded-2xl border px-3 py-1 text-xs font-black",
                  statusClassName(offer.status),
                ].join(" ")}
              >
                {statusLabel(offer.status)}
              </span>

              <span className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-black text-[#FFB5A4]">
                {formatBenefit(offer)}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#DDE8EA]">
              {statusHint(offer.status)}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Всего QR"
          value={redemptionsSummary.total}
          hint="Все созданные QR по скидке"
        />

        <MetricTile
          label="Использовано"
          value={redemptionsSummary.used}
          hint="Подтверждено staff-пользователями"
        />

        <MetricTile
          label="Оборот"
          value={formatAmount(totalOrderAmount)}
          hint="Сумма заказов по QR"
        />

        <MetricTile
          label="Бонусы"
          value={totalBonusEarned}
          hint="Начислено в кошельки студентов"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="grid gap-6">
          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Offer summary
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Основная информация
            </h2>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <InfoRow label="ID" value={offer.id} />
              <InfoRow label="Slug" value={`/${offer.slug}`} />
              <InfoRow label="Категория" value={offer.category?.name ?? "—"} />
              <InfoRow label="Статус" value={statusLabel(offer.status)} />
              <InfoRow label="Выгода" value={formatBenefit(offer)} />
              <InfoRow label="Тип выгоды" value={offer.benefitType ?? "—"} />
              <InfoRow
                label="Мин. сумма"
                value={formatAmount(offer.minPurchaseAmount)}
              />
              <InfoRow
                label="Лимит на пользователя"
                value={offer.usageLimitPerUser ?? "—"}
              />
              <InfoRow
                label="Общий лимит"
                value={offer.totalUsageLimit ?? "—"}
              />
              <InfoRow
                label="Featured"
                value={offer.isFeatured ? "Да" : "Нет"}
              />
              <InfoRow label="Начало" value={formatDateTime(offer.startAt)} />
              <InfoRow label="Конец" value={formatDateTime(offer.endAt)} />
              <InfoRow label="Создано" value={formatDateTime(offer.createdAt)} />
              <InfoRow label="Обновлено" value={formatDateTime(offer.updatedAt)} />
              <InfoRow
                label="Опубликовано"
                value={formatDateTime(offer.publishedAt)}
              />
            </div>

            <div className="mt-6 rounded-[26px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                Описание
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#526470]">
                {offer.description || "Описание не указано."}
              </p>
            </div>

            {offer.terms && (
              <div className="mt-4 rounded-[26px] border border-[#FFE0D8] bg-[#FFF7F4] p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FF7F6E]">
                  Условия
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#8A4B3F]">
                  {offer.terms}
                </p>
              </div>
            )}
          </section>

          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Locations
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Точки действия
            </h2>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {offer.locations.length === 0 ? (
                <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5 text-sm leading-7 text-[#6B7280] md:col-span-2">
                  Для этой скидки не выбраны отдельные точки.
                </div>
              ) : (
                offer.locations.map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))
              )}
            </div>
          </section>

          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  QR redemptions
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Использования скидки
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Показано: {redemptions.length} QR по этой скидке.
                </p>
              </div>

              <Link
                href="/partner/redemptions"
                className="text-sm font-black text-[#FF7F6E]"
              >
                Вся история →
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {redemptionsQuery.isLoading && !redemptionsQuery.data ? (
                <div className="ub-skeleton h-28 rounded-[24px]" />
              ) : redemptions.length === 0 ? (
                <EmptyRedemptions />
              ) : (
                redemptions.map((item) => (
                  <RedemptionCard key={item.id} item={item} />
                ))
              )}
            </div>
          </section>

          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Moderation requests
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  История заявок
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Показано: {moderationRequests.length} заявок по этой скидке.
                </p>
              </div>

              <Link
                href="/partner/requests"
                className="text-sm font-black text-[#FF7F6E]"
              >
                Все заявки →
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {moderationRequests.length === 0 ? (
                <EmptyRequests />
              ) : (
                moderationRequests.map((item) => (
                  <RequestCard key={item.id} item={item} />
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[92px]">
          <section className="ub-animate-fade-up ub-delay-100 ub-card rounded-[34px] p-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Cover media
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Изображение скидки
            </h2>

            <div className="mt-5 flex h-40 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#17384B,#FF9F8A)] text-center text-sm font-black uppercase tracking-[0.18em] text-white">
              UniBestia Offer
            </div>

            <p className="mt-4 text-sm leading-7 text-[#6B7280]">
              Загрузите изображение, чтобы карточка скидки выглядела лучше в
              каталоге студентов.
            </p>

            <div className="mt-5">
              <OfferImageUploadButton
                offerId={offer.id}
                getToken={getToken}
                onUploaded={() => offerDetailQuery.refetch()}
              />
            </div>
          </section>

          <section className="rounded-[34px] border border-[#FFE0D8] bg-[#FFF7F4] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
              Workflow
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Жизненный цикл
            </h2>

            <div className="mt-5 grid gap-3 text-sm">
              <InfoRow label="1" value="Draft" />
              <InfoRow label="2" value="Pending review" />
              <InfoRow label="3" value="Approved / Rejected" />
              <InfoRow label="4" value="Published" />
            </div>

            <p className="mt-5 text-sm leading-7 text-[#8A4B3F]">
              Страница показывает связь между оффером, заявками модерации и
              QR-использованиями.
            </p>
          </section>

          <section className="ub-card rounded-[34px] p-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Quick links
            </p>

            <div className="mt-5 grid gap-3">
              <Link
                href="/partner/offers"
                className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
              >
                Все скидки
              </Link>

              <Link
                href="/partner/offers/new"
                className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
              >
                Создать новую
              </Link>

              <Link
                href="/partner/analytics"
                className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
              >
                Аналитика
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
