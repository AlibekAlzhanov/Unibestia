"use client";

import { type FormEvent, type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  totalOffers: number;
  publishedOffers: number;
  parent?: {
    id: string;
    name: string;
  } | null;
};

function boolLabel(value: boolean): string {
  return value ? "Активна" : "Выключена";
}

function statusClass(value: boolean): string {
  return value
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function parseSortOrder(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function generateSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ә/g, "a")
    .replace(/ғ/g, "g")
    .replace(/қ/g, "q")
    .replace(/ң/g, "n")
    .replace(/ө/g, "o")
    .replace(/ұ/g, "u")
    .replace(/ү/g, "u")
    .replace(/һ/g, "h")
    .replace(/і/g, "i")
    .replace(/а/g, "a")
    .replace(/б/g, "b")
    .replace(/в/g, "v")
    .replace(/г/g, "g")
    .replace(/д/g, "d")
    .replace(/е/g, "e")
    .replace(/ё/g, "e")
    .replace(/ж/g, "zh")
    .replace(/з/g, "z")
    .replace(/и/g, "i")
    .replace(/й/g, "y")
    .replace(/к/g, "k")
    .replace(/л/g, "l")
    .replace(/м/g, "m")
    .replace(/н/g, "n")
    .replace(/о/g, "o")
    .replace(/п/g, "p")
    .replace(/р/g, "r")
    .replace(/с/g, "s")
    .replace(/т/g, "t")
    .replace(/у/g, "u")
    .replace(/ф/g, "f")
    .replace(/х/g, "h")
    .replace(/ц/g, "ts")
    .replace(/ч/g, "ch")
    .replace(/ш/g, "sh")
    .replace(/щ/g, "sch")
    .replace(/ы/g, "y")
    .replace(/э/g, "e")
    .replace(/ю/g, "yu")
    .replace(/я/g, "ya")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function LoadingCategories(): JSX.Element {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="ub-skeleton h-7 w-28 rounded-full" />
          <div className="ub-skeleton mt-5 h-6 w-2/3 rounded-full" />
          <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
          <div className="ub-skeleton mt-5 h-12 rounded-2xl" />
        </article>
      ))}
    </section>
  );
}

function EmptyCategories({
  activeOnly,
  onReset,
}: {
  activeOnly: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        #
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Категорий нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {activeOnly
          ? "Сейчас показаны только активные категории. Можно отключить фильтр."
          : "Создай первую категорию, чтобы партнёры могли привязывать скидки к разделам каталога."}
      </p>

      {activeOnly && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Показать все
        </button>
      )}
    </section>
  );
}

function CategoryCard({
  category,
  isBusy,
  onToggle,
}: {
  category: CategoryItem;
  isBusy: boolean;
  onToggle: () => void;
}): JSX.Element {
  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={[
            "rounded-2xl border px-3 py-1 text-xs font-black",
            statusClass(category.isActive),
          ].join(" ")}
        >
          {boolLabel(category.isActive)}
        </span>

        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
          sort: {category.sortOrder}
        </span>
      </div>

      <h2 className="mt-5 text-2xl font-black leading-tight text-[#17384B]">
        {category.name}
      </h2>

      <p className="mt-2 break-all rounded-2xl bg-[#F9FAF8] px-4 py-3 font-mono text-xs font-bold text-[#526470]">
        /{category.slug}
      </p>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Parent
          </p>
          <p className="mt-1 font-bold text-[#17384B]">
            {category.parent?.name ?? "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F9FAF8] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
              Total
            </p>
            <p className="mt-1 text-2xl font-black text-[#17384B]">
              {category.totalOffers}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F9FAF8] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
              Published
            </p>
            <p className="mt-1 text-2xl font-black text-[#17384B]">
              {category.publishedOffers}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={isBusy}
        className={[
          "mt-auto rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
          category.isActive
            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-[#17384B] text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] hover:bg-[#255B73]",
        ].join(" ")}
      >
        {isBusy
          ? "Обновляем..."
          : category.isActive
            ? "Выключить"
            : "Включить"}
      </button>
    </article>
  );
}

export default function AdminCategoriesPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [activeOnly, setActiveOnly] = useState(false);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery(
    trpc.business.admin.listCategories.queryOptions({
      activeOnly,
    })
  );

  const categories = useMemo(
    () => (categoriesQuery.data?.items ?? []) as CategoryItem[],
    [categoriesQuery.data?.items]
  );

  const totalCategories = categories.length;
  const activeCount = categories.filter((category) => category.isActive).length;
  const disabledCount = categories.filter(
    (category) => !category.isActive
  ).length;
  const publishedOfferCount = categories.reduce(
    (sum, category) => sum + category.publishedOffers,
    0
  );

  async function createCategory(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsCreating(true);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.admin.createCategory.mutate({
        name: name.trim(),
        slug: slug.trim() || undefined,
        sortOrder: parseSortOrder(sortOrder),
        isActive: true,
      });

      setName("");
      setSlug("");
      setSortOrder("0");
      setMessage("Категория создана.");
      await categoriesQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось создать категорию"
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleCategory(
    categoryId: string,
    isActive: boolean
  ): Promise<void> {
    setBusyCategoryId(categoryId);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.admin.updateCategory.mutate({
        categoryId,
        isActive: !isActive,
      });

      setMessage("Категория обновлена.");
      await categoriesQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить категорию"
      );
    } finally {
      setBusyCategoryId(null);
    }
  }

  function handleNameChange(value: string): void {
    setName(value);

    if (!slug.trim()) {
      setSlug(generateSlug(value));
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin / Categories
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Категории каталога
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Управляйте разделами каталога скидок: создавайте категории,
              меняйте активность, сортировку и отслеживайте количество офферов.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalCategories}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Active
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{publishedOfferCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Published
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={createCategory}
        className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Новая категория
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Создать раздел каталога
            </h2>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#526470]">
            <input
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
              type="checkbox"
              className="h-4 w-4"
            />
            Только активные
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_150px]">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Название
            </span>

            <input
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="Например: Фастфуд"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Slug
            </span>

            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="fastfood"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Sort
            </span>

            <input
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#6B7280]">
            Slug можно оставить пустым, но для красивых URL лучше использовать
            латиницу: <span className="font-mono">coffee</span>,{" "}
            <span className="font-mono">fastfood</span>,{" "}
            <span className="font-mono">education</span>.
          </p>

          <button
            type="submit"
            disabled={isCreating}
            className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Создаём..." : "Создать категорию"}
          </button>
        </div>
      </form>

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {categoriesQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить категории: {categoriesQuery.error.message}
        </div>
      )}

      {categoriesQuery.isLoading ? (
        <LoadingCategories />
      ) : categories.length === 0 ? (
        <EmptyCategories
          activeOnly={activeOnly}
          onReset={() => setActiveOnly(false)}
        />
      ) : (
        <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => {
            const isBusy = busyCategoryId === category.id;

            return (
              <div
                key={category.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <CategoryCard
                  category={category}
                  isBusy={isBusy}
                  onToggle={() => {
                    void toggleCategory(category.id, category.isActive);
                  }}
                />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}