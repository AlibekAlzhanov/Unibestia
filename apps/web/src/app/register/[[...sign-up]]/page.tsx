import { SignUp } from "@clerk/nextjs";
import { type JSX } from "react";
import { Logo } from "@/components/logo";

const displayFont = {
  fontFamily: "Nunito, Inter, sans-serif",
};

export default function RegisterPage(): JSX.Element {
  return (
    <div className="relative overflow-hidden bg-[#F7F6F1] px-4 py-6 md:px-6 lg:px-8">
      <div className="absolute left-0 top-0 -z-10 h-[280px] w-[280px] rounded-full bg-[#FFF0EA] blur-3xl" />
      <div className="absolute right-0 top-16 -z-10 h-[280px] w-[280px] rounded-full bg-[#E8F8F5] blur-3xl" />

      <div className="mx-auto grid w-full max-w-[1160px] gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="rounded-[30px] border border-[#E5ECE9] bg-[linear-gradient(135deg,#FFFFFF_0%,#FAFCFB_100%)] p-6 shadow-[0_16px_34px_rgba(15,23,42,0.06)] md:p-8">
         
          <Logo href="/" size="md" />

          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-[#FFF0EB] px-4 py-2 text-sm font-semibold text-[#4B6472]">
              Регистрация в UniBestie
            </span>

            <h1
              className="text-[26px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[30px]"
              style={displayFont}
            >
              Создай аккаунт и открой доступ к студенческим скидкам
            </h1>

            <p className="text-[15px] leading-6 text-[#5A7280]">
              Зарегистрируйся, чтобы получить доступ к каталогу предложений, бонусам,
              привилегиям и удобному личному кабинету студента.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              "Скидки от популярных брендов и партнёров",
              "Бонусы, кэшбэк и персональные предложения",
              "Удобный профиль, кошелёк и история активаций",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-[#E7ECE9] bg-white p-3.5 text-[14px] font-semibold text-[#17384B] shadow-[0_10px_20px_rgba(15,23,42,0.04)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#E5ECE9] bg-white/95 p-6 shadow-[0_16px_34px_rgba(15,23,42,0.06)] md:p-8">
          
          <div className="mt-6 rounded-[24px] border border-[#EEF2EF] bg-[#FBFCFB] p-4">
            <SignUp
              path="/register"
              routing="path"
              signInUrl="/login"
              forceRedirectUrl="/home"
            />
          </div>

        </div>
      </div>
    </div>
  );
}