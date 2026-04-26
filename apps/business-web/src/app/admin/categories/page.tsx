"use client";

import { type FormEvent, type JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

function boolLabel(value: boolean): string {
  return value ? "Активна" : "Выключена";
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

  const categories = categoriesQuery.data?.items ?? [];

  async function createCategory(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsCreating(true);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.business.admin.createCategory.mutate({
        name,
        slug: slug.trim() || undefined,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
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

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Categories
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Категории каталога
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Управление разделами каталога скидок: создание, активность, сортировка
          и количество офферов.
        </p>
      </section>

      <form
        onSubmit={createCategory}
        className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.4fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="Название категории"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="slug optional"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <input
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            type="number"
            min="0"
            step="1"
            placeholder="Sort"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {isCreating ? "Создаём..." : "Создать"}
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#526470]">
          <input
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
            type="checkbox"
          />
          Показывать только активные
        </label>
      </form>

      {message && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {categoriesQuery.error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить категории: {categoriesQuery.error.message}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="hidden grid-cols-[1fr_0.8fr_0.5fr_0.5fr_0.8fr_0.7fr] border-b border-[#E5ECE9] bg-[#F9FAF8] px-5 py-4 text-sm font-black text-[#17384B] xl:grid">
          <div>Название</div>
          <div>Slug</div>
          <div>Sort</div>
          <div>Статус</div>
          <div>Офферы</div>
          <div>Действия</div>
        </div>

        {categoriesQuery.isLoading ? (
          <div className="p-5 text-sm text-[#6B7280]">Загружаем...</div>
        ) : categories.length === 0 ? (
          <div className="p-5 text-sm text-[#6B7280]">Категорий нет.</div>
        ) : (
          categories.map((category) => {
            const isBusy = busyCategoryId === category.id;

            return (
              <div
                key={category.id}
                className="grid gap-4 border-b border-[#E5ECE9] px-5 py-4 text-sm last:border-b-0 xl:grid-cols-[1fr_0.8fr_0.5fr_0.5fr_0.8fr_0.7fr]"
              >
                <div>
                  <p className="font-black text-[#17384B]">{category.name}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Parent: {category.parent?.name ?? "—"}
                  </p>
                </div>

                <div className="font-semibold text-[#526470]">
                  {category.slug}
                </div>

                <div className="font-semibold text-[#17384B]">
                  {category.sortOrder}
                </div>

                <div>
                  <span
                    className={
                      category.isActive
                        ? "rounded-xl bg-green-50 px-3 py-1 text-xs font-black text-green-700"
                        : "rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-red-700"
                    }
                  >
                    {boolLabel(category.isActive)}
                  </span>
                </div>

                <div className="text-[#6B7280]">
                  <p>Total: {category.totalOffers}</p>
                  <p>Published: {category.publishedOffers}</p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleCategory(category.id, category.isActive)
                    }
                    disabled={isBusy}
                    className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-sm font-bold text-[#526470] disabled:opacity-50"
                  >
                    {category.isActive ? "Выключить" : "Включить"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
