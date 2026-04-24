import Link from "next/link";
import { type JSX } from "react";

const portalCards = [
  {
    href: "/partner",
    eyebrow: "Partner Portal",
    title: "Кабинет партнёра",
    description:
      "Управление скидками, точками продаж, сотрудниками, заявками и статистикой использований.",
  },
  {
    href: "/admin",
    eyebrow: "Admin Portal",
    title: "Админ-панель",
    description:
      "Глобальное управление пользователями, партнёрами, офферами, категориями, модерацией и аудитом.",
  },
];

const flowItems = [
  {
    title: "Партнёр создаёт скидку",
    description:
      "Партнёр готовит оффер, выбирает категорию, условия, точки действия и отправляет на публикацию.",
  },
  {
    title: "Админ модерирует",
    description:
      "Администратор проверяет партнёра, скидку, текст, условия и переводит оффер в опубликованный статус.",
  },
  {
    title: "Студент получает QR",
    description:
      "Клиентский сайт и мобильное приложение показывают скидку и создают QR-код через backend.",
  },
  {
    title: "Система считает аналитику",
    description:
      "Партнёр и админ видят использования, популярные скидки, динамику и эффективность предложений.",
  },
];

export default function BusinessHomePage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-[#17384B] p-8 text-white shadow-[0_20px_45px_rgba(23,56,75,0.18)] md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB5A4]">
          UniBestia Business
        </p>
        <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
          Портал управления партнёрами, скидками и аналитикой
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#DDE8EA]">
          Этот сайт предназначен для партнёров и администраторов. Staff QR
          оставлен отдельно как временный dev-test, а основная логика портала —
          управление бизнес-процессами UniBestia.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/partner"
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f28977]"
          >
            Открыть кабинет партнёра
          </Link>
          <Link
            href="/admin"
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Открыть админ-панель
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {portalCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
              {card.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#17384B]">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              {card.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
            Бизнес-процесс
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#17384B]">
            Как работает портал
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flowItems.map((item, index) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-[#E5ECE9] bg-[#F9FAF8] p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17384B] text-sm font-black text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 font-bold text-[#17384B]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#FFE0D8] bg-[#FFF7F4] p-5">
        <p className="text-sm font-bold text-[#8A4B3F]">
          Staff QR временно оставлен для dev-test:
        </p>
        <p className="mt-1 text-sm leading-6 text-[#8A4B3F]">
          В финальной архитектуре обычный сотрудник будет использовать отдельное
          staff mobile app. Страница{" "}
          <Link href="/staff" className="font-black underline">
            /staff
          </Link>{" "}
          пока нужна только для проверки QR-flow через браузер.
        </p>
      </section>
    </div>
  );
}
