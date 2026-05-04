import Link from "next/link";
import { type JSX } from "react";

type AdminSection = {
  href: string;
  title: string;
  description: string;
  badge: string;
  accent?: boolean;
};

const sections: AdminSection[] = [
  {
    href: "/admin/users",
    title: "Пользователи",
    description: "Студенты, сотрудники, партнёры, администраторы и роли.",
    badge: "Users",
  },
  {
    href: "/admin/verifications",
    title: "Проверка студентов",
    description:
      "PDF электронного студенческого, approve/reject и verified-статус.",
    badge: "Verify",
  },
  {
    href: "/admin/universities",
    title: "Университеты",
    description:
      "Справочник университетов, официальные названия, document keywords и email-домены.",
    badge: "Universities",
    accent: true,
  },
  {
    href: "/admin/education-programs",
    title: "Образовательные программы",
    description:
      "Группы образовательных программ: B057, названия RU/KZ/EN и степень обучения.",
    badge: "Programs",
    accent: true,
  },
  {
    href: "/admin/partners",
    title: "Партнёры",
    description: "Компании, точки, сотрудники, заявки и статус проверки.",
    badge: "Partners",
  },
  {
    href: "/admin/offers",
    title: "Офферы",
    description: "Все скидки платформы, публикация, блокировка и архив.",
    badge: "Offers",
  },
  {
    href: "/admin/categories",
    title: "Категории",
    description: "Каталог скидок: разделы, сортировка и активность.",
    badge: "Catalog",
  },
  {
    href: "/admin/moderation",
    title: "Модерация",
    description: "Заявки, отзывы, жалобы и проверка контента.",
    badge: "Review",
  },
  {
    href: "/admin/analytics",
    title: "Аналитика",
    description: "Показатели платформы, рост, популярные офферы и партнёры.",
    badge: "Stats",
  },
  {
    href: "/admin/audit",
    title: "Аудит",
    description: "Журнал действий администраторов, партнёров и сотрудников.",
    badge: "Audit",
  },
];

function SectionCard({ section }: { section: AdminSection }): JSX.Element {
  return (
    <Link
      href={section.href}
      className={[
        "group rounded-[30px] border p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(15,23,42,0.10)]",
        section.accent
          ? "border-[#FFB5A4] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF7F4_100%)]"
          : "border-[#E5ECE9] bg-white/88",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={[
            "rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.12em]",
            section.accent
              ? "bg-[#17384B] text-white"
              : "bg-[#FFF0EB] text-[#FF7F6E]",
          ].join(" ")}
        >
          {section.badge}
        </span>

        <span className="text-lg font-black text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-[#FF7F6E]">
          →
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black text-[#17384B]">
        {section.title}
      </h2>

      <p className="mt-3 text-sm leading-7 text-[#6B7280]">
        {section.description}
      </p>

      <span className="mt-5 inline-flex text-sm font-black text-[#FF7F6E]">
        Открыть раздел →
      </span>
    </Link>
  );
}

export default function AdminPortalPage(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin Dashboard
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Администрирование UniBestia
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Центральный раздел управления системой: пользователи, партнёры,
              скидки, справочники университетов, образовательные программы,
              модерация, аналитика и аудит.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/admin/universities"
                className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:bg-[#FFF0EB]"
              >
                Университеты
              </Link>

              <Link
                href="/admin/education-programs"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Образовательные программы
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
              Student Verification V2
            </p>
            <p className="mt-3 text-2xl font-black leading-tight">
              Справочники для проверки студенческого статуса
            </p>
            <p className="mt-3 text-sm leading-7 text-[#DDE8EA]">
              Добавьте университеты и группы образовательных программ, чтобы
              студент выбирал данные из списка, а PDF-проверка сравнивала
              документ с контролируемыми значениями.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Разделы
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B] md:text-3xl">
              Управление платформой
            </h2>
          </div>
        </div>

        <div className="mt-5 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <SectionCard key={section.href} section={section} />
          ))}
        </div>
      </section>
    </div>
  );
}
