import { type JSX } from "react";

export default function AdminCategoriesPage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Категории
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Категории
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Управление разделами каталога, сортировкой и активностью категорий.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
        <p className="font-bold text-[#17384B]">
          Раздел подготовлен под подключение backend CRUD
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Следующим этапом добавим реальные tRPC admin endpoints, таблицы,
          фильтры, формы создания и действия модерации.
        </p>
      </section>
    </div>
  );
}
