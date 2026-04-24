import { type JSX } from "react";

const cards = [
  {
    title: "Пользователи",
    description: "Студенты, сотрудники, партнёры и администраторы.",
  },
  {
    title: "Партнёры",
    description: "Компании, точки продаж, сотрудники и заявки.",
  },
  {
    title: "Офферы",
    description: "Создание, модерация, публикация и архивирование скидок.",
  },
  {
    title: "Категории",
    description: "Разделы каталога, сортировка и активность.",
  },
  {
    title: "Модерация",
    description: "Проверка контента, жалоб, отзывов и заявок.",
  },
  {
    title: "Аудит",
    description: "Журнал действий администраторов и сотрудников.",
  },
];

export default function AdminPortalPage(): JSX.Element {
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <div className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#17384B]">
          Администрирование UniBestia
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Это отдельный admin/business web. Дальше подключим backend CRUD для
          пользователей, партнёров, офферов, категорий, модерации и аудита.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-[28px] border border-[#E5ECE9] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
          >
            <h2 className="text-xl font-bold text-[#17384B]">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
