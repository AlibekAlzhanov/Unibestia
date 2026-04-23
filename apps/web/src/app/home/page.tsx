import { type JSX } from "react";

export default function HomePage(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      <div className="rounded-[28px] border border-[#E5ECE9] bg-white p-8 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#9CA3AF]">
          UniBestie
        </p>
        <h1 className="text-3xl font-semibold text-[#1F2937]">
          Добро пожаловать в личный кабинет
        </h1>
        <p className="mt-3 max-w-2xl text-[#6B7280]">
          Это временный экран для закрытой зоны. Следующим шагом сюда подключим
          реальные блоки: новые скидки, популярные предложения и мини-кошелёк.
        </p>
      </div>
    </div>
  );
}
