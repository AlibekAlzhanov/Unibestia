import Image from "next/image";
import Link from "next/link";
import { type JSX } from "react";
import { Button } from "@repo/ui/components/base/button";
import { LandingBackground } from "@/components/landing/landing-background";

const studentBenefits = [
  {
    title: "Скидки рядом с тобой",
    text: "Кафе, магазины, сервисы и места отдыха собраны в одной студенческой витрине.",
    tone: "linear-gradient(135deg,#A6EFEE 0%,#84DDD8 100%)",
    icon: "₸",
  },
  {
    title: "Быстрое получение",
    text: "Открыл предложение, нажал получить, показал QR-код партнёру и использовал скидку.",
    tone: "linear-gradient(135deg,#FFA69F 0%,#F28E80 100%)",
    icon: "QR",
  },
  {
    title: "Бонусы и история",
    text: "Следи за активированными скидками, бонусами и личной выгодой в кабинете студента.",
    tone: "linear-gradient(135deg,#BEDD87 0%,#A7CF63 100%)",
    icon: "★",
  },
];

const platformCards = [
  {
    title: "Для студентов",
    text: "Понятный каталог скидок, быстрый доступ к QR и персональная история использований.",
    value: "Student App",
  },
  {
    title: "Для партнёров",
    text: "Бизнес может публиковать предложения, управлять акциями и видеть активность.",
    value: "Partner Portal",
  },
  {
    title: "Для администраторов",
    text: "Модерация партнёров, проверка скидок, аналитика и контроль качества платформы.",
    value: "Admin Panel",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Создай аккаунт",
    text: "Студент проходит регистрацию и получает доступ к закрытой витрине предложений.",
  },
  {
    step: "02",
    title: "Выбери скидку",
    text: "В каталоге можно найти актуальные предложения по категориям, партнёрам и выгоде.",
  },
  {
    step: "03",
    title: "Получи QR",
    text: "QR-код показывается сотруднику партнёра, после чего скидка фиксируется в истории.",
  },
];

const categories = [
  "Кафе",
  "Фастфуд",
  "Книги",
  "Техника",
  "Образование",
  "Спорт",
  "Сервисы",
  "Развлечения",
];

const stats = [
  { label: "Категории", value: "8+" },
  { label: "Сценарии", value: "3" },
  { label: "Доступ", value: "24/7" },
];

const displayFont = {
  fontFamily: "Nunito, Inter, sans-serif",
};

export default function LandingPage(): JSX.Element {
  return (
    <LandingBackground>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-16 px-4 pb-16 pt-6 sm:px-6 md:gap-20 md:pb-20 md:pt-8 lg:px-8">
        <section className="grid min-h-[calc(100vh-96px)] items-center gap-10 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-12">
          <div className="ub-animate-fade-up space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5ECE9] bg-white/86 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#17384B] shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-md sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#FF7F6E]" />
              Студенческие скидки в Казахстане
            </div>

            <div className="max-w-2xl space-y-5">
              <h1
                className="ub-section-title text-[36px] font-black leading-[1.02] tracking-[-0.05em] text-[#163E52] sm:text-[48px] md:text-[58px] lg:text-[66px]"
                style={displayFont}
              >
                Экономь на любимых местах через UniBestia
              </h1>

              <p className="max-w-xl text-[16px] leading-8 text-[#4B6472] md:text-[18px]">
                UniBestia — цифровая платформа студенческих скидок, бонусов и
                партнёрских предложений. Студент быстро находит выгоду, получает
                QR-код и использует его у партнёра.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="ub-gradient-button h-12 rounded-2xl border-0 px-6 text-white"
              >
                <Link href="/register">Начать бесплатно</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-[#DCE6E1] bg-white px-6 text-[#17384B] shadow-[0_12px_24px_rgba(15,23,42,0.04)] hover:bg-[#F8FAF8]"
              >
                <Link href="/login">У меня уже есть аккаунт</Link>
              </Button>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3 pt-2">
              {stats.map((item, index) => (
                <div
                  key={item.label}
                  className={[
                    "ub-card rounded-[22px] p-4 text-center",
                    index === 1 ? "ub-delay-100" : "",
                    index === 2 ? "ub-delay-200" : "",
                  ].join(" ")}
                >
                  <p
                    className="text-2xl font-black text-[#17384B] md:text-3xl"
                    style={displayFont}
                  >
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="ub-animate-fade-up ub-delay-200 relative mx-auto w-full max-w-[680px]">
            <div className="ub-animate-float absolute -left-3 top-10 z-10 hidden rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.12)] backdrop-blur-md sm:block">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FF7F6E]">
                Сегодня
              </p>
              <p className="mt-1 text-xl font-black text-[#17384B]">
                -25% кофе
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">рядом с кампусом</p>
            </div>

            <div className="ub-animate-float absolute -right-2 bottom-12 z-10 hidden rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.12)] backdrop-blur-md md:block">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6B7280]">
                QR готов
              </p>
              <p className="mt-1 text-xl font-black text-[#17384B]">
                1 касание
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">для активации</p>
            </div>

            <div className="absolute -left-4 top-12 h-40 w-40 rounded-full bg-[#E9F8F4] blur-3xl" />
            <div className="absolute -right-4 bottom-8 h-44 w-44 rounded-full bg-[#FFEAE4] blur-3xl" />

            <div className="group relative overflow-hidden rounded-[34px] border border-[#E7ECE9] bg-white/90 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
              <Image
                src="/landing/home-scene.png"
                alt="UniBestie — главный визуал платформы"
                width={1400}
                height={900}
                className="ub-image-lift h-auto w-full rounded-[28px]"
                priority
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {studentBenefits.map((item, index) => (
            <article
              key={item.title}
              className={[
                "ub-card ub-animate-fade-up rounded-[30px] p-5 md:p-6",
                index === 1 ? "ub-delay-100" : "",
                index === 2 ? "ub-delay-200" : "",
              ].join(" ")}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-[18px] font-black text-white shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                style={{ background: item.tone }}
              >
                {item.icon}
              </div>

              <h2
                className="mt-5 text-[22px] font-black leading-tight text-[#163E52]"
                style={displayFont}
              >
                {item.title}
              </h2>

              <p className="mt-3 text-[15px] leading-7 text-[#5D7481]">
                {item.text}
              </p>
            </article>
          ))}
        </section>

        <section className="ub-glass-card ub-animate-fade-up overflow-hidden rounded-[42px] px-5 py-8 md:px-8 md:py-10 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="group relative overflow-hidden rounded-[32px] border border-[#E7ECE9] bg-white/92 p-2 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <Image
                src="/landing/brand-offers.png"
                alt="Популярные предложения брендов"
                width={1400}
                height={900}
                className="ub-image-lift h-auto w-full rounded-[26px]"
              />
            </div>

            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#D8E6E1] bg-white px-4 py-2 text-sm font-black text-[#4B6472]">
                Партнёрские предложения
              </div>

              <div className="space-y-4">
                <h2
                  className="ub-section-title text-[32px] font-black leading-tight tracking-[-0.04em] text-[#163E52] md:text-[42px]"
                  style={displayFont}
                >
                  Всё, что нужно студенту, собрано в одной витрине
                </h2>

                <p className="max-w-xl text-[16px] leading-8 text-[#566F7C]">
                  Платформа помогает студенту быстро понять, где выгоднее
                  заказать еду, купить товар, воспользоваться услугой или
                  получить бонусы за активность.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[#E5ECE9] bg-white px-4 py-2 text-sm font-bold text-[#526470] shadow-[0_8px_18px_rgba(15,23,42,0.035)]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#FF7F6E]">
              Как это работает
            </p>

            <h2
              className="ub-section-title mt-3 text-[32px] font-black leading-tight tracking-[-0.04em] text-[#163E52] md:text-[44px]"
              style={displayFont}
            >
              Скидка должна получаться быстро и понятно
            </h2>

            <p className="mt-4 text-[16px] leading-8 text-[#566F7C]">
              Основной сценарий UniBestia построен вокруг простого пути:
              регистрация, выбор предложения и подтверждение через QR-код.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <article
                key={item.step}
                className={[
                  "ub-card ub-animate-fade-up rounded-[30px] p-6",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-2xl bg-[#FFF0EB] px-4 py-2 text-sm font-black text-[#FF7F6E]">
                    {item.step}
                  </span>

                  <span className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#A6EFEE,#FF9F8A)] opacity-80" />
                </div>

                <h3
                  className="mt-6 text-[22px] font-black text-[#163E52]"
                  style={displayFont}
                >
                  {item.title}
                </h3>

                <p className="mt-3 text-[15px] leading-7 text-[#5D7481]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[42px] border border-[#EAEDE8] bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(252,250,246,0.92)_100%)] px-5 py-8 shadow-[0_20px_44px_rgba(15,23,42,0.045)] md:px-8 md:py-10">
          <div className="absolute right-0 top-0 h-36 w-52 rounded-bl-[52px] bg-[linear-gradient(135deg,rgba(166,239,238,0.22),rgba(255,166,159,0.08))]" />

          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#D8E6E1] bg-white px-4 py-2 text-sm font-black text-[#4B6472]">
                Экосистема UniBestia
              </div>

              <div className="space-y-4">
                <h2
                  className="ub-section-title text-[32px] font-black leading-tight tracking-[-0.04em] text-[#163E52] md:text-[42px]"
                  style={displayFont}
                >
                  Не просто лендинг, а основа полноценной платформы
                </h2>

                <p className="max-w-xl text-[16px] leading-8 text-[#566F7C]">
                  Проект объединяет несколько ролей: студента, партнёра,
                  сотрудника и администратора. Поэтому интерфейс сразу
                  закладывается как масштабируемая система.
                </p>
              </div>

              <div className="grid gap-4">
                {platformCards.map((item, index) => (
                  <article
                    key={item.title}
                    className={[
                      "ub-card rounded-[26px] p-5",
                      index === 1 ? "ub-delay-100" : "",
                      index === 2 ? "ub-delay-200" : "",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3
                          className="text-[21px] font-black leading-tight text-[#163E52]"
                          style={displayFont}
                        >
                          {item.title}
                        </h3>

                        <p className="mt-2 text-[15px] leading-6 text-[#5E7480]">
                          {item.text}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#F7F6F1] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#526470]">
                        {item.value}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[32px] border border-[#E7ECE9] bg-white/92 p-2 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <Image
                src="/landing/benefits-scene.png"
                alt="UniBestie — сцена с бонусами и преимуществами"
                width={1400}
                height={900}
                className="ub-image-lift h-auto w-full rounded-[26px]"
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[42px] border border-[#E8ECE8] bg-[linear-gradient(135deg,#17384B_0%,#255B73_100%)] px-6 py-10 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:px-10 md:py-12">
          <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#FFB5A4]">
                Готов к старту
              </p>

              <h2
                className="ub-section-title text-[30px] font-black leading-tight tracking-[-0.04em] md:text-[42px]"
                style={displayFont}
              >
                Создай аккаунт и открой личную студенческую витрину выгод
              </h2>

              <p className="mt-4 text-[16px] leading-8 text-[#DDE8EA]">
                После регистрации можно перейти в каталог, смотреть скидки,
                получать QR-коды и отслеживать личную историю использований.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="ub-gradient-button h-12 rounded-2xl border-0 px-6 text-white"
              >
                <Link href="/register">Регистрация</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 text-white hover:bg-white/15"
              >
                <Link href="/login">Войти</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </LandingBackground>
  );
}