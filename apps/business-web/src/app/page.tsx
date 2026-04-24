import Link from "next/link";
import { type JSX } from "react";

export default function BusinessHomePage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-[#17384B] p-8 text-white shadow-[0_20px_45px_rgba(23,56,75,0.18)] md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB5A4]">
          UniBestia Business
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
          Отдельный портал для сотрудников, партнёров и администраторов
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#DDE8EA]">
          Клиентский сайт остаётся в `apps/web`, а этот портал живёт отдельно в
          `apps/business-web` и подключается к тому же backend через tRPC.
        </p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link
          href="/staff"
          className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
            Staff
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#17384B]">
            Проверка QR-кода
          </h2>
          <p className="mt-3 text-[#6B7280]">
            Сотрудник вводит или сканирует QR-токен студента, проверяет данные
            и подтверждает использование скидки.
          </p>
        </Link>

        <Link
          href="/admin"
          className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
            Admin
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#17384B]">
            Админ-панель
          </h2>
          <p className="mt-3 text-[#6B7280]">
            Заготовка под управление пользователями, партнёрами, офферами,
            категориями, модерацией и аудитом.
          </p>
        </Link>
      </div>
    </div>
  );
}
