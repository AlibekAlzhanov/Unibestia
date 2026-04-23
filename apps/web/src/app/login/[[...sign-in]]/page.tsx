import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { type JSX } from "react";
import { Logo } from "@/components/logo";

const displayFont = {
  fontFamily: "Nunito, Inter, sans-serif",
};

export default function LoginPage(): JSX.Element {
  return (
    <div className="relative overflow-hidden bg-[#F7F6F1] px-4 py-10 md:px-6 lg:px-8">
      <div className="absolute left-0 top-0 -z-10 h-[320px] w-[320px] rounded-full bg-[#E8F8F5] blur-3xl" />
      <div className="absolute right-0 top-16 -z-10 h-[320px] w-[320px] rounded-full bg-[#FFF0EA] blur-3xl" />

      <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-[32px] border border-[#E5ECE9] bg-white/95 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-10">
          <Logo size="md" showTagline />
          <h1 className="mt-8 text-[34px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[40px]" style={displayFont}>
            С возвращением
          </h1>
          <p className="mt-3 max-w-lg text-[16px] leading-7 text-[#5B7380]">
            Войди в UniBestie, чтобы открыть каталог скидок, бонусный кошелёк и свои
            персональные предложения.
          </p>

          <div className="mt-8 rounded-[28px] border border-[#EEF2EF] bg-[#FBFCFB] p-4 md:p-5">
            <SignIn path="/login" routing="path" signUpUrl="/register" forceRedirectUrl="/home" />
          </div>

          <p className="mt-6 text-sm text-[#667B87]">
            Ещё нет аккаунта?{" "}
            <Link href="/register" className="font-semibold text-[#F28977] hover:underline">
              Создать аккаунт
            </Link>
          </p>
        </div>

        <div className="rounded-[34px] border border-[#E5ECE9] bg-[linear-gradient(135deg,#FFFFFF_0%,#FAFCFB_100%)] p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-10">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-[#EEF9F8] px-4 py-2 text-sm font-semibold text-[#4B6472]">
              Быстрый вход в аккаунт
            </span>
            <h2 className="text-[30px] font-black leading-tight tracking-[-0.03em] text-[#163E52] md:text-[36px]" style={displayFont}>
              Продолжай пользоваться своими студенческими выгодами
            </h2>
            <p className="text-[16px] leading-7 text-[#5A7280]">
              После входа ты сможешь просматривать новые акции, популярные предложения,
              бонусы и историю полученных скидок.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {[
              "Доступ к каталогу предложений",
              "Бонусный кошелёк и история начислений",
              "Персональные скидки и любимые категории",
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
      </div>
    </div>
  );
}
