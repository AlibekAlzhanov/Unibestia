
import Image from "next/image";
import Link from "next/link";
import { type JSX } from "react";
import { Button } from "@repo/ui/components/base/button";
import { LandingBackground } from "@/components/landing/landing-background";

const studentBenefits = [
  {
    title: "Единая точка входа",
    text: "Каталог, личный кабинет, бонусный баланс и история активаций собраны в одном сервисе.",
    tone: "linear-gradient(180deg,#A6EFEE 0%,#84DDD8 100%)",
    icon: "◈",
  },
  {
    title: "Понятная выгода",
    text: "Студент быстро видит, где можно сэкономить, а где получить дополнительные бонусы за активность.",
    tone: "linear-gradient(180deg,#FFA69F 0%,#F28E80 100%)",
    icon: "✦",
  },
  {
    title: "Полезно каждый день",
    text: "Предложения подбираются под повседневную жизнь: еда, техника, книги, сервисы и досуг.",
    tone: "linear-gradient(180deg,#BEDD87 0%,#A7CF63 100%)",
    icon: "₸",
  },
];

const partnerCards = [
  { brand: "Magnum", discount: "до -10%", text: "покупки и отдельные акции" },
  { brand: "Dodo Pizza", discount: "до -15%", text: "часть меню и комбо-предложения" },
  { brand: "Technodom", discount: "до -7%", text: "определённые категории техники" },
  { brand: "Marwin", discount: "до -12%", text: "книги, подарки и selected товары" },
];

const platformCards = [
  {
    title: "Гибкая система бонусов",
    text: "Пользователь не только получает скидку, но и возвращается в сервис ради накопительной ценности.",
  },
  {
    title: "Быстрый сценарий получения",
    text: "Открыть предложение, активировать выгоду и перейти к использованию можно за несколько простых шагов.",
  },
  {
    title: "Масштабирование по регионам",
    text: "Платформа сразу закладывает рост по городам Казахстана и удобную работу с локальными партнёрами.",
  },
];

const displayFont = {
  fontFamily: "Nunito, Inter, sans-serif",
};

export default function LandingPage(): JSX.Element {
  return (
    <LandingBackground>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-20 px-4 pb-20 pt-8 md:px-6 lg:px-8">
        <section className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <div className="max-w-xl space-y-4">
              <h1
                className="text-[30px] font-black leading-[1.06] tracking-[-0.03em] text-[#163E52] md:text-[40px] lg:text-[48px]"
                style={displayFont}
              >
                Платформа выгод для современной студенческой жизни
              </h1>

              <p className="max-w-lg text-[15px] leading-7 text-[#4B6472] md:text-[16px]">
                UniBestie помогает быстро ориентироваться в предложениях от партнёров,
                следить за личной выгодой и возвращаться в сервис ради новых возможностей.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-2xl border-0 bg-[#FF9F8A] px-5 text-white shadow-[0_14px_26px_rgba(255,159,138,0.28)] hover:bg-[#F28977]"
              >
                <Link href="/register">Начать бесплатно</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl border-[#DCE6E1] bg-white px-5 text-[#17384B] hover:bg-[#F8FAF8]"
              >
                <Link href="/login">У меня уже есть аккаунт</Link>
              </Button>
            </div>

            <div className="grid max-w-xl gap-4 pt-2">
              {studentBenefits.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[26px] border border-[#E5ECE9] bg-white/95 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.04)]"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[20px] text-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
                    style={{ background: item.tone }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h2
                      className="text-[19px] font-extrabold leading-tight text-[#163E52] md:text-[21px]"
                      style={displayFont}
                    >
                      {item.title}
                    </h2>
                    <p className="mt-1 text-[14px] leading-6 text-[#5D7481]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto max-w-[620px]">
            <div className="absolute -left-4 top-12 h-36 w-36 rounded-full bg-[#E9F8F4] blur-3xl" />
            <div className="absolute -right-4 bottom-8 h-36 w-36 rounded-full bg-[#FFEAE4] blur-3xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-[#E7ECE9] bg-white/90 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <Image
                src="/landing/home-scene.png"
                alt="UniBestie — главный визуал платформы"
                width={1400}
                height={900}
                className="h-auto w-full rounded-[24px]"
                priority
              />
            </div>
          </div>
        </section>

        <section className="relative rounded-[40px] border border-white/70 bg-white/72 px-5 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm md:px-8 md:py-10">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[30px] border border-[#E7ECE9] bg-white/92 p-2 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <Image
                src="/landing/brand-offers.png"
                alt="Популярные предложения брендов"
                width={1400}
                height={900}
                className="h-auto w-full rounded-[24px]"
              />
            </div>

            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#D8E6E1] bg-white px-4 py-2 text-sm font-semibold text-[#4B6472]">
                Партнёрские предложения
              </div>

              <div className="space-y-3">
                <h2
                  className="text-[32px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[40px]"
                  style={displayFont}
                >
                  Реальные бренды, понятные сценарии использования
                </h2>
                <p className="max-w-xl text-[16px] leading-8 text-[#566F7C]">
                  Витрина собирает офферы в одном интерфейсе и помогает студенту быстрее
                  принимать решение, где покупать, заказывать или пользоваться услугой.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {partnerCards.map((item) => (
                  <article
                    key={item.brand}
                    className="rounded-[24px] border border-[#E5ECE9] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6A7E8A]">
                      {item.brand}
                    </p>
                    <p
                      className="mt-2 text-[26px] font-black text-[#163E52]"
                      style={displayFont}
                    >
                      {item.discount}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5E7480]">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative rounded-[42px] border border-[#EAEDE8] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.9)_100%)] px-5 py-8 shadow-[0_20px_44px_rgba(15,23,42,0.045)] md:px-8 md:py-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#D8E6E1] bg-white px-4 py-2 text-sm font-semibold text-[#4B6472]">
                Что даёт платформа
              </div>

              <div className="space-y-3">
                <h2
                  className="text-[32px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[40px]"
                  style={displayFont}
                >
                  Не просто красивый лендинг, а понятный продуктовый сценарий
                </h2>
                <p className="max-w-xl text-[16px] leading-8 text-[#566F7C]">
                  UniBestie строится как удобный студенту сервис: с быстрым входом,
                  личной выгодой, историей действий и расширением на новые города и категории.
                </p>
              </div>

              <div className="grid gap-4">
                {platformCards.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[26px] border border-[#E5ECE9] bg-white p-5 shadow-[0_12px_26px_rgba(15,23,42,0.05)]"
                  >
                    <h3
                      className="text-[21px] font-extrabold leading-tight text-[#163E52]"
                      style={displayFont}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-6 text-[#5E7480]">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-[#E7ECE9] bg-white/92 p-2 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <div className="absolute right-0 top-0 h-28 w-40 rounded-bl-[40px] bg-[linear-gradient(135deg,rgba(166,239,238,0.22),rgba(255,166,159,0.08))]" />
              <Image
                src="/landing/benefits-scene.png"
                alt="UniBestie — сцена с бонусами и преимуществами"
                width={1400}
                height={900}
                className="h-auto w-full rounded-[24px]"
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[42px] border border-[#E8ECE8] bg-[linear-gradient(135deg,#FFFFFF_0%,#FBFCFB_100%)] px-6 py-10 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:px-10">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-[#E8F8F5] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#FFF0EA] blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7E8A]">
                Готов к старту
              </p>
              <h2
                className="text-[30px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[38px]"
                style={displayFont}
              >
                Создай аккаунт и переходи к личной студенческой витрине выгод
              </h2>
              <p className="mt-3 text-[16px] leading-7 text-[#566F7C]">
                После регистрации можно будет открыть каталог, следить за бонусами,
                просматривать активные предложения и строить свой привычный маршрут экономии.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-2xl border-0 bg-[#FF9F8A] px-5 text-white shadow-[0_14px_26px_rgba(255,159,138,0.28)] hover:bg-[#F28977]"
              >
                <Link href="/register">Регистрация</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl border-[#DCE6E1] bg-white px-5 text-[#17384B] hover:bg-[#F8FAF8]"
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
