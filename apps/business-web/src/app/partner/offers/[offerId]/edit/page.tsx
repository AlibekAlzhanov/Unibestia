"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, type JSX, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type BenefitType = "discount" | "bonus" | "cashback" | "mixed";
type DiscountType = "percent" | "fixed_amount";
type OfferStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

type CategoryItem = {
  id: string;
  name: string;
  slug?: string | null;
};

type LocationItem = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  isActive?: boolean | null;
};

type OfferDetailData = {
  offer: {
    id: string;
    categoryId: string;
    title: string;
    slug: string;
    shortDescription?: string | null;
    description: string;
    terms?: string | null;
    benefitType: BenefitType;
    discountType?: DiscountType | null;
    discountValue?: string | null;
    cashbackPercent?: string | null;
    bonusRewardPoints?: number | null;
    minPurchaseAmount?: string | null;
    usageLimitPerUser?: number | null;
    totalUsageLimit?: number | null;
    startAt: Date | string;
    endAt?: Date | string | null;
    status: OfferStatus;
    locations: Array<{
      id: string;
      name: string;
      city?: string | null;
      address?: string | null;
      isActive?: boolean | null;
    }>;
  };
};

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toDateTimeLocal(value?: Date | string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fieldClass(isEnabled: boolean): string {
  return [
    "mt-2 h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none transition",
    isEnabled
      ? "border-[#D8E3DE] bg-[#F9FAF8] text-[#17384B] placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
      : "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]",
  ].join(" ");
}

function textAreaClass(): string {
  return "mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]";
}

function helperTextClass(isEnabled: boolean): string {
  return [
    "mt-1 block text-xs",
    isEnabled ? "text-[#6B7280]" : "text-[#9CA3AF]",
  ].join(" ");
}

function benefitLabel(value: BenefitType): string {
  const labels: Record<BenefitType, string> = {
    discount: "Скидка",
    cashback: "Cashback",
    bonus: "Бонусы",
    mixed: "Mixed",
  };

  return labels[value];
}

function benefitDescription(value: BenefitType): string {
  const descriptions: Record<BenefitType, string> = {
    discount: "Классическая скидка в процентах или фиксированной сумме.",
    cashback: "Возврат части суммы студенту в виде cashback-предложения.",
    bonus: "Начисление бонусных баллов за использование предложения.",
    mixed: "Комбинированная выгода: скидка, cashback и/или бонусы вместе.",
  };

  return descriptions[value];
}

function discountTypeLabel(value: DiscountType): string {
  const labels: Record<DiscountType, string> = {
    percent: "Процент",
    fixed_amount: "Фиксированная сумма",
  };

  return labels[value];
}

function discountTypeDescription(value: DiscountType): string {
  return value === "percent"
    ? "Например: 15 означает скидку 15%."
    : "Например: 1000 означает скидку 1000 ₸.";
}

function formatBenefitPreview({
  benefitType,
  discountType,
  discountValue,
  cashbackPercent,
  bonusRewardPoints,
}: {
  benefitType: BenefitType;
  discountType: DiscountType;
  discountValue: string;
  cashbackPercent: string;
  bonusRewardPoints: string;
}): string {
  const parts: string[] = [];

  if ((benefitType === "discount" || benefitType === "mixed") && discountValue) {
    parts.push(
      discountType === "percent"
        ? `-${Number(discountValue).toFixed(0)}%`
        : `-${Number(discountValue).toFixed(0)} ₸`
    );
  }

  if (
    (benefitType === "cashback" || benefitType === "mixed") &&
    cashbackPercent
  ) {
    parts.push(`${Number(cashbackPercent).toFixed(0)}% cashback`);
  }

  if (
    (benefitType === "bonus" || benefitType === "mixed") &&
    bonusRewardPoints
  ) {
    parts.push(`+${Number(bonusRewardPoints).toFixed(0)} бонусов`);
  }

  return parts.length > 0 ? parts.join(" · ") : benefitLabel(benefitType);
}

function canEditOffer(status?: string): boolean {
  return status === "draft" || status === "rejected";
}

function LoadingEditPage(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-8 w-44 rounded-full" />
        <div className="ub-skeleton mt-6 h-12 w-2/3 rounded-full" />
        <div className="ub-skeleton mt-5 h-4 w-full rounded-full" />
      </section>
    </div>
  );
}

export default function EditPartnerOfferPage(): JSX.Element {
  const router = useRouter();
  const params = useParams<{ offerId: string }>();
  const offerId = params.offerId;
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const detailQuery = useQuery({
    ...trpc.business.partner.getOfferById.queryOptions({ offerId }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const categoriesQuery = useQuery(trpc.catalog.listCategories.queryOptions());

  const locationsQuery = useQuery({
    ...trpc.business.partner.listLocations.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const offerData = detailQuery.data as OfferDetailData | undefined;
  const offer = offerData?.offer ?? null;
  const categories = (categoriesQuery.data ?? []) as CategoryItem[];
  const locations = (locationsQuery.data?.items ?? []) as LocationItem[];

  const [isInitialized, setIsInitialized] = useState(false);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [terms, setTerms] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [benefitType, setBenefitType] = useState<BenefitType>("discount");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [cashbackPercent, setCashbackPercent] = useState("");
  const [bonusRewardPoints, setBonusRewardPoints] = useState("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState("");
  const [totalUsageLimit, setTotalUsageLimit] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [submitForReview, setSubmitForReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!offer || isInitialized) {
      return;
    }

    setTitle(offer.title ?? "");
    setShortDescription(offer.shortDescription ?? "");
    setDescription(offer.description ?? "");
    setTerms(offer.terms ?? "");
    setCategoryId(offer.categoryId ?? "");
    setSelectedLocationIds(offer.locations.map((location) => location.id));
    setBenefitType(offer.benefitType ?? "discount");
    setDiscountType(offer.discountType ?? "percent");
    setDiscountValue(offer.discountValue ? String(Number(offer.discountValue)) : "");
    setCashbackPercent(
      offer.cashbackPercent ? String(Number(offer.cashbackPercent)) : ""
    );
    setBonusRewardPoints(
      typeof offer.bonusRewardPoints === "number"
        ? String(offer.bonusRewardPoints)
        : ""
    );
    setMinPurchaseAmount(
      offer.minPurchaseAmount ? String(Number(offer.minPurchaseAmount)) : ""
    );
    setUsageLimitPerUser(
      typeof offer.usageLimitPerUser === "number"
        ? String(offer.usageLimitPerUser)
        : ""
    );
    setTotalUsageLimit(
      typeof offer.totalUsageLimit === "number"
        ? String(offer.totalUsageLimit)
        : ""
    );
    setStartAt(toDateTimeLocal(offer.startAt));
    setEndAt(toDateTimeLocal(offer.endAt));
    setSubmitForReview(false);
    setIsInitialized(true);
  }, [isInitialized, offer]);

  const selectedCategoryId = useMemo(() => {
    return categoryId || categories[0]?.id || "";
  }, [categoryId, categories]);

  const discountEnabled =
    benefitType === "discount" || benefitType === "mixed";
  const cashbackEnabled =
    benefitType === "cashback" || benefitType === "mixed";
  const bonusEnabled = benefitType === "bonus" || benefitType === "mixed";

  useEffect(() => {
    if (!discountEnabled) {
      setDiscountValue("");
    }

    if (!cashbackEnabled) {
      setCashbackPercent("");
    }

    if (!bonusEnabled) {
      setBonusRewardPoints("");
    }
  }, [discountEnabled, cashbackEnabled, bonusEnabled]);

  function toggleLocation(locationId: string): void {
    setSelectedLocationIds((current) =>
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId]
    );
  }

  function selectAllLocations(): void {
    setSelectedLocationIds(locations.map((location) => location.id));
  }

  function clearLocations(): void {
    setSelectedLocationIds([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSaving(true);
    setError(null);
    setSavedStatus(null);

    try {
      const updated = await trpcClient.business.partner.updateOffer.mutate({
        offerId,
        categoryId: selectedCategoryId,
        title: title.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim(),
        terms: terms.trim() || undefined,
        benefitType,
        discountType,
        discountValue: discountEnabled
          ? parseOptionalNumber(discountValue)
          : undefined,
        cashbackPercent: cashbackEnabled
          ? parseOptionalNumber(cashbackPercent)
          : undefined,
        bonusRewardPoints: bonusEnabled
          ? parseOptionalNumber(bonusRewardPoints)
          : undefined,
        minPurchaseAmount: parseOptionalNumber(minPurchaseAmount),
        usageLimitPerUser: parseOptionalNumber(usageLimitPerUser),
        totalUsageLimit: parseOptionalNumber(totalUsageLimit),
        startAt: toIsoOrUndefined(startAt),
        endAt: toIsoOrUndefined(endAt),
        locationIds: selectedLocationIds,
        submitForReview,
      });

      setSavedStatus(`Скидка обновлена: ${updated.title} (${updated.status})`);

      setTimeout(() => {
        router.push(`/partner/offers/${offerId}`);
      }, 700);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить скидку"
      );
    } finally {
      setIsSaving(false);
    }
  }

  const previewBenefit = formatBenefitPreview({
    benefitType,
    discountType,
    discountValue,
    cashbackPercent,
    bonusRewardPoints,
  });

  if (detailQuery.isLoading && !detailQuery.data) {
    return <LoadingEditPage />;
  }

  if (detailQuery.error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] flex-col justify-center px-4 py-8">
        <section className="rounded-[34px] border border-red-200 bg-red-50 p-8 text-red-700">
          <p className="text-sm font-black uppercase tracking-[0.18em]">
            Ошибка
          </p>

          <h1 className="mt-2 text-3xl font-black">Не удалось загрузить скидку</h1>

          <p className="mt-3 text-sm leading-7">{detailQuery.error.message}</p>

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

  if (!offer) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] flex-col justify-center px-4 py-8">
        <section className="ub-card rounded-[34px] p-8 text-center">
          <h1 className="text-3xl font-black text-[#17384B]">
            Скидка не найдена
          </h1>

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

  if (!canEditOffer(offer.status)) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] flex-col justify-center px-4 py-8">
        <section className="ub-card rounded-[34px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
            !
          </div>

          <h1 className="mt-5 text-3xl font-black text-[#17384B]">
            Эту скидку нельзя редактировать
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
            Редактирование доступно только для черновиков и отклонённых скидок.
            Текущий статус: {offer.status}.
          </p>

          <Link
            href={`/partner/offers/${offer.id}`}
            className="ub-gradient-button mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black text-white"
          >
            Вернуться к деталям
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
              href={`/partner/offers/${offer.id}`}
              className="mb-5 inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              ← Назад к деталям
            </Link>

            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Partner / Offers / Edit
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Редактировать скидку
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Измените данные оффера, сохраните как черновик или сразу
              отправьте скидку на повторную модерацию.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
              Preview
            </p>

            <p className="mt-2 line-clamp-2 text-2xl font-black">
              {title.trim() || "Название скидки"}
            </p>

            <p className="mt-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-[#FFB5A4]">
              {previewBenefit}
            </p>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#DDE8EA]">
              {shortDescription.trim() ||
                "Короткое описание будет отображаться в карточке каталога."}
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
      >
        <div className="grid min-w-0 gap-6">
          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Основная информация
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Карточка предложения
            </h2>

            <div className="mt-6 grid gap-5">
              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Название *
                </span>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  minLength={3}
                  maxLength={255}
                  placeholder="Например: Скидка 20% на бургеры"
                  className={fieldClass(true)}
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Короткое описание
                </span>

                <input
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  maxLength={500}
                  placeholder="Кратко для карточки каталога"
                  className={fieldClass(true)}
                />
              </label>

              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="text-sm font-black text-[#17384B]">
                      Категория *
                    </span>

                    <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                      Выберите раздел каталога, в котором будет отображаться
                      скидка.
                    </p>
                  </div>

                  {selectedCategoryId && (
                    <span className="w-fit rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
                      Выбрано
                    </span>
                  )}
                </div>

                {categoriesQuery.isLoading ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="ub-skeleton h-[82px] rounded-[22px]"
                      />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="mt-3 rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                    Категории не найдены. Сначала добавьте категории в админке:
                    <Link
                      href="/admin/categories"
                      className="ml-1 font-black underline underline-offset-4"
                    >
                      открыть категории
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category) => {
                      const isSelected = selectedCategoryId === category.id;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setCategoryId(category.id)}
                          className={[
                            "group rounded-[22px] border p-4 text-left transition",
                            isSelected
                              ? "border-[#FFB5A4] bg-[#FFF7F4] shadow-[0_14px_30px_rgba(255,127,110,0.12)]"
                              : "border-[#E5ECE9] bg-white hover:border-[#FFB5A4] hover:bg-[#FFFDFB]",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className={[
                                  "line-clamp-1 text-sm font-black",
                                  isSelected
                                    ? "text-[#FF7F6E]"
                                    : "text-[#17384B]",
                                ].join(" ")}
                              >
                                {category.name}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                                Категория каталога скидок
                              </p>
                            </div>

                            <span
                              className={[
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black transition",
                                isSelected
                                  ? "border-[#FF7F6E] bg-[#FF7F6E] text-white"
                                  : "border-[#D8E3DE] bg-white text-transparent group-hover:border-[#FFB5A4]",
                              ].join(" ")}
                            >
                              ✓
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Описание *
                </span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  minLength={10}
                  rows={5}
                  placeholder="Полное описание предложения"
                  className={textAreaClass()}
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Условия
                </span>

                <textarea
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  rows={4}
                  placeholder="Например: действует только при предъявлении студенческого QR"
                  className={textAreaClass()}
                />
              </label>
            </div>
          </section>

          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Точки действия
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Где будет действовать скидка
            </h2>

            <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <p className="text-sm leading-7 text-[#6B7280]">
                Выберите точки продаж. Если точек нет, сначала создайте их в
                разделе “Точки продаж”.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllLocations}
                  className="rounded-2xl border border-[#D8E3DE] bg-white px-4 py-2 text-xs font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
                >
                  Все
                </button>

                <button
                  type="button"
                  onClick={clearLocations}
                  className="rounded-2xl border border-[#D8E3DE] bg-white px-4 py-2 text-xs font-black text-[#526470] transition hover:bg-[#F7F6F1]"
                >
                  Очистить
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {locationsQuery.isLoading ? (
                <div className="rounded-2xl bg-[#F9FAF8] p-5 text-sm text-[#6B7280]">
                  Загружаем точки...
                </div>
              ) : locations.length === 0 ? (
                <div className="rounded-2xl bg-[#F9FAF8] p-5 text-sm leading-7 text-[#6B7280]">
                  У партнёра пока нет точек. Сначала добавь точку в разделе
                  “Точки продаж”.
                </div>
              ) : (
                locations.map((location) => {
                  const isSelected = selectedLocationIds.includes(location.id);

                  return (
                    <label
                      key={location.id}
                      className={[
                        "cursor-pointer rounded-[24px] border p-4 transition",
                        isSelected
                          ? "border-[#FFB5A4] bg-[#FFF7F4]"
                          : "border-[#E5ECE9] bg-white hover:border-[#FFB5A4]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLocation(location.id)}
                          className="mt-1"
                        />

                        <span>
                          <span className="block text-sm font-black text-[#17384B]">
                            {location.name}
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-[#6B7280]">
                            {[location.city, location.address]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Выгода
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Тип предложения
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {(["discount", "cashback", "bonus", "mixed"] as BenefitType[]).map(
                (option) => {
                  const isActive = benefitType === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBenefitType(option)}
                      className={[
                        "rounded-2xl px-4 py-3 text-sm font-black transition",
                        isActive
                          ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                          : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                      ].join(" ")}
                    >
                      {benefitLabel(option)}
                    </button>
                  );
                }
              )}
            </div>

            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              {benefitDescription(benefitType)}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <span
                  className={[
                    "text-sm font-black",
                    discountEnabled ? "text-[#17384B]" : "text-[#9CA3AF]",
                  ].join(" ")}
                >
                  Тип скидки
                </span>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(["percent", "fixed_amount"] as DiscountType[]).map(
                    (option) => {
                      const isActive = discountType === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (discountEnabled) {
                              setDiscountType(option);
                            }
                          }}
                          disabled={!discountEnabled}
                          className={[
                            "rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                            isActive && discountEnabled
                              ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                              : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                          ].join(" ")}
                        >
                          {discountTypeLabel(option)}
                        </button>
                      );
                    }
                  )}
                </div>

                <span className={helperTextClass(discountEnabled)}>
                  {discountTypeDescription(discountType)}
                </span>
              </div>

              <label>
                <span
                  className={[
                    "text-sm font-black",
                    discountEnabled ? "text-[#17384B]" : "text-[#9CA3AF]",
                  ].join(" ")}
                >
                  Значение скидки
                </span>

                <input
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  disabled={!discountEnabled}
                  required={benefitType === "discount"}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15"
                  className={fieldClass(discountEnabled)}
                />

                <span className={helperTextClass(discountEnabled)}>
                  Например: 15 = 15% или 15 ₸.
                </span>
              </label>

              <label>
                <span
                  className={[
                    "text-sm font-black",
                    cashbackEnabled ? "text-[#17384B]" : "text-[#9CA3AF]",
                  ].join(" ")}
                >
                  Cashback %
                </span>

                <input
                  value={cashbackPercent}
                  onChange={(event) => setCashbackPercent(event.target.value)}
                  disabled={!cashbackEnabled}
                  required={benefitType === "cashback"}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="5"
                  className={fieldClass(cashbackEnabled)}
                />

                <span className={helperTextClass(cashbackEnabled)}>
                  Доступно для “Cashback” и “Mixed”.
                </span>
              </label>

              <label>
                <span
                  className={[
                    "text-sm font-black",
                    bonusEnabled ? "text-[#17384B]" : "text-[#9CA3AF]",
                  ].join(" ")}
                >
                  Бонусные баллы
                </span>

                <input
                  value={bonusRewardPoints}
                  onChange={(event) => setBonusRewardPoints(event.target.value)}
                  disabled={!bonusEnabled}
                  required={benefitType === "bonus"}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  className={fieldClass(bonusEnabled)}
                />

                <span className={helperTextClass(bonusEnabled)}>
                  Доступно для “Бонусы” и “Mixed”.
                </span>
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Мин. сумма покупки
                </span>

                <input
                  value={minPurchaseAmount}
                  onChange={(event) => setMinPurchaseAmount(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2000"
                  className={fieldClass(true)}
                />

                <span className={helperTextClass(true)}>
                  Общее условие для любого типа выгоды.
                </span>
              </label>
            </div>
          </section>

          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Ограничения
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Лимиты и срок действия
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Лимит на пользователя
                </span>

                <input
                  value={usageLimitPerUser}
                  onChange={(event) => setUsageLimitPerUser(event.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  className={fieldClass(true)}
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Общий лимит
                </span>

                <input
                  value={totalUsageLimit}
                  onChange={(event) => setTotalUsageLimit(event.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="500"
                  className={fieldClass(true)}
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Начало действия
                </span>

                <input
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  type="datetime-local"
                  className={fieldClass(true)}
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Конец действия
                </span>

                <input
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  type="datetime-local"
                  className={fieldClass(true)}
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[92px]">
          <section className="ub-animate-fade-up ub-delay-100 ub-card rounded-[34px] p-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Offer preview
            </p>

            <div className="mt-5 overflow-hidden rounded-[28px] border border-[#E5ECE9] bg-white">
              <div className="flex h-36 items-center justify-center bg-[linear-gradient(135deg,#17384B,#FF9F8A)] text-sm font-black uppercase tracking-[0.18em] text-white">
                UniBestia
              </div>

              <div className="p-5">
                <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
                  {previewBenefit}
                </span>

                <h3 className="mt-4 line-clamp-2 text-xl font-black text-[#17384B]">
                  {title.trim() || "Название скидки"}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6B7280]">
                  {shortDescription.trim() ||
                    "Короткое описание будет отображаться в карточке каталога."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#FFE0D8] bg-[#FFF7F4] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
              Status
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Сохранение
            </h2>

            <label className="mt-5 flex items-start gap-3 rounded-2xl bg-white p-4">
              <input
                checked={submitForReview}
                onChange={(event) => setSubmitForReview(event.target.checked)}
                type="checkbox"
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black text-[#17384B]">
                  Отправить на модерацию
                </span>

                <span className="mt-1 block text-sm leading-6 text-[#6B7280]">
                  Если выключено — скидка сохранится как draft.
                </span>
              </span>
            </label>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {savedStatus && (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {savedStatus}
              </div>
            )}

            <div className="mt-5 grid gap-3">
              <button
                type="submit"
                disabled={isSaving || !selectedCategoryId}
                className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Сохраняем..." : "Сохранить изменения"}
              </button>

              <Link
                href={`/partner/offers/${offer.id}`}
                className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
              >
                Отмена
              </Link>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
