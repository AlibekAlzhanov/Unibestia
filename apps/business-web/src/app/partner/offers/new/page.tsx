"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type JSX, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type BenefitType = "discount" | "bonus" | "cashback" | "mixed";
type DiscountType = "percent" | "fixed_amount";

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

function fieldClass(isEnabled: boolean): string {
  return [
    "mt-2 h-12 w-full rounded-2xl border px-4 text-sm outline-none transition",
    isEnabled
      ? "border-[#D8E3DE] bg-[#F9FAF8] text-[#17384B] focus:border-[#FF9F8A]"
      : "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]",
  ].join(" ");
}

function helperTextClass(isEnabled: boolean): string {
  return [
    "mt-1 block text-xs",
    isEnabled ? "text-[#6B7280]" : "text-[#9CA3AF]",
  ].join(" ");
}

export default function NewPartnerOfferPage(): JSX.Element {
  const router = useRouter();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const categoriesQuery = useQuery(trpc.catalog.listCategories.queryOptions());
  const locationsQuery = useQuery(
    trpc.business.partner.listLocations.queryOptions()
  );

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
  const [createdStatus, setCreatedStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = categoriesQuery.data ?? [];
  const locations = locationsQuery.data?.items ?? [];

  const selectedCategoryId = useMemo(() => {
    return categoryId || categories[0]?.id || "";
  }, [categoryId, categories]);

  useEffect(() => {
    if (locations.length > 0 && selectedLocationIds.length === 0) {
      setSelectedLocationIds(locations.map((location) => location.id));
    }
  }, [locations, selectedLocationIds.length]);

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
    setCreatedStatus(null);

    try {
      const created = await trpcClient.business.partner.createOffer.mutate({
        categoryId: selectedCategoryId,
        title,
        shortDescription: shortDescription.trim() || undefined,
        description,
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

      setCreatedStatus(`Скидка создана: ${created.title} (${created.status})`);

      setTimeout(() => {
        router.push("/partner/offers");
      }, 700);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось создать скидку"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[980px] px-4 py-10 md:px-6 lg:px-8">
      <Link href="/partner/offers" className="mb-5 inline-flex text-sm font-bold text-[#FF7F6E]">
        ← Назад к скидкам
      </Link>

      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner / Offers / New
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Создать скидку
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Поля выгоды зависят от выбранного типа: скидка, cashback, бонусы или
          смешанное предложение.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
      >
        <div className="grid gap-5">
          <label>
            <span className="text-sm font-bold text-[#17384B]">Название</span>
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
            <span className="text-sm font-bold text-[#17384B]">
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

          <label>
            <span className="text-sm font-bold text-[#17384B]">Категория</span>
            <select
              value={selectedCategoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className={fieldClass(true)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <section className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Точки действия
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Выбери, в каких точках будет действовать скидка.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllLocations}
                  className="rounded-2xl border border-[#D8E3DE] bg-white px-3 py-2 text-xs font-bold text-[#17384B]"
                >
                  Все
                </button>
                <button
                  type="button"
                  onClick={clearLocations}
                  className="rounded-2xl border border-[#D8E3DE] bg-white px-3 py-2 text-xs font-bold text-[#526470]"
                >
                  Очистить
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {locationsQuery.isLoading ? (
                <p className="text-sm text-[#6B7280]">Загружаем точки...</p>
              ) : locations.length === 0 ? (
                <p className="text-sm text-[#6B7280]">
                  У партнёра пока нет точек. Сначала добавь точку в разделе
                  “Точки продаж”.
                </p>
              ) : (
                locations.map((location) => (
                  <label
                    key={location.id}
                    className="flex items-start gap-3 rounded-2xl border border-[#E5ECE9] bg-white p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLocationIds.includes(location.id)}
                      onChange={() => toggleLocation(location.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-[#17384B]">
                        {location.name}
                      </span>
                      <span className="mt-1 block text-sm text-[#6B7280]">
                        {[location.city, location.address].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </section>

          <label>
            <span className="text-sm font-bold text-[#17384B]">Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
              rows={5}
              placeholder="Полное описание предложения"
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm outline-none focus:border-[#FF9F8A]"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-[#17384B]">Условия</span>
            <textarea
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              rows={4}
              placeholder="Например: действует только при предъявлении студенческого QR"
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm outline-none focus:border-[#FF9F8A]"
            />
          </label>

          <div className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Выгода
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Тип выгоды
                </span>
                <select
                  value={benefitType}
                  onChange={(event) =>
                    setBenefitType(event.target.value as BenefitType)
                  }
                  className={fieldClass(true)}
                >
                  <option value="discount">Скидка</option>
                  <option value="cashback">Cashback</option>
                  <option value="bonus">Бонусы</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>

              <label>
                <span
                  className={[
                    "text-sm font-bold",
                    discountEnabled ? "text-[#17384B]" : "text-[#9CA3AF]",
                  ].join(" ")}
                >
                  Тип скидки
                </span>
                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(event.target.value as DiscountType)
                  }
                  disabled={!discountEnabled}
                  className={fieldClass(discountEnabled)}
                >
                  <option value="percent">Процент</option>
                  <option value="fixed_amount">Фиксированная сумма</option>
                </select>
                <span className={helperTextClass(discountEnabled)}>
                  Доступно только для “Скидка” и “Mixed”.
                </span>
              </label>

              <label>
                <span
                  className={[
                    "text-sm font-bold",
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
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label>
                <span
                  className={[
                    "text-sm font-bold",
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
                  Доступно только для “Cashback” и “Mixed”.
                </span>
              </label>

              <label>
                <span
                  className={[
                    "text-sm font-bold",
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
                  Доступно только для “Бонусы” и “Mixed”.
                </span>
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
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
                  Общее условие, работает для любого типа выгоды.
                </span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-[#17384B]">
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
              <span className="text-sm font-bold text-[#17384B]">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-[#17384B]">
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
              <span className="text-sm font-bold text-[#17384B]">
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

          <label className="flex items-start gap-3 rounded-2xl bg-[#F9FAF8] p-4">
            <input
              checked={submitForReview}
              onChange={(event) => setSubmitForReview(event.target.checked)}
              type="checkbox"
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-bold text-[#17384B]">
                Отправить на модерацию
              </span>
              <span className="mt-1 block text-sm text-[#6B7280]">
                Если выключено — скидка сохранится как draft.
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {createdStatus && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
              {createdStatus}
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href="/partner/offers"
              className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-center text-sm font-bold text-[#17384B]"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSaving || !selectedCategoryId}
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSaving ? "Сохраняем..." : "Создать скидку"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
