import Link from "next/link";
import { type JSX } from "react";

export default function AdminModerationPage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Moderation
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Модерация
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Первый подключённый сценарий модерации — проверка скидок партнёров.
          Админ может одобрить, опубликовать, отклонить или отправить скидку в
          архив.
        </p>

        <Link
          href="/admin/offers"
          className="mt-6 inline-flex rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
        >
          Перейти к модерации скидок
        </Link>
      </section>
    </div>
  );
}
