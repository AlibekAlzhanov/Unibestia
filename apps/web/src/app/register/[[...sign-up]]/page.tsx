import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { type JSX } from "react";
import { Logo } from "@/components/logo";

const displayFont = {
  fontFamily: "Nunito, Inter, sans-serif",
};

export default function RegisterPage(): JSX.Element {
  return (
    <div className="relative overflow-hidden bg-[#F7F6F1] px-4 py-10 md:px-6 lg:px-8">
      <div className="absolute left-0 top-0 -z-10 h-[320px] w-[320px] rounded-full bg-[#FFF0EA] blur-3xl" />
      <div className="absolute right-0 top-20 -z-10 h-[320px] w-[320px] rounded-full bg-[#E8F8F5] blur-3xl" />

      <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="rounded-[34px] border border-[#E5ECE9] bg-[linear-gradient(135deg,#FFFFFF_0%,#FAFCFB_100%)] p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-10">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-[#FFF0EB] px-4 py-2 text-sm font-semibold text-[#4B6472]">
              Регистрация в UniBestie
            </span>
            <h1 className="text-[30px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[36px]" style={displayFont}>
              Создай аккаунт и открой доступ к студенческим скидкам
            </h1>
            <p className="text-[16px] leading-7 text-[#5A7280]">
              Зарегистрируйся, чтобы получить доступ к каталогу предложений, бонусам,
              привилегиям и удобному личному кабинету студента.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {[
              "Скидки от популярных брендов и партнёров",
              "Бонусы, кэшбэк и персональные предложения",
              "Удобный профиль, кошелёк и история активаций",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#E7ECE9] bg-white p-4 text-[15px] font-semibold text-[#17384B] shadow-[0_10px_20px_rgba(15,23,42,0.04)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#E5ECE9] bg-white/95 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-10">
          <Logo size="md" showTagline />
          <h2 className="mt-8 text-[34px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[40px]" style={displayFont}>
            Добро пожаловать
          </h2>
          <p className="mt-3 max-w-lg text-[16px] leading-7 text-[#5B7380]">
            После регистрации ты сможешь просматривать предложения, копить бонусы и
            пользоваться выгодами платформы UniBestie.
          </p>

          <div className="mt-8 rounded-[28px] border border-[#EEF2EF] bg-[#FBFCFB] p-4 md:p-5">
            <SignUp path="/register" routing="path" signInUrl="/login" forceRedirectUrl="/home" />
          </div>

          <p className="mt-6 text-sm text-[#667B87]">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-[#F28977] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
