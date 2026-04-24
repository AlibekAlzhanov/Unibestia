"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export default function PartnerPendingPage(): JSX.Element {
  const trpc = useTRPC();
  const meQuery = useQuery(trpc.business.auth.getMe.queryOptions());

  const partner = meQuery.data?.partner;

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[900px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-8 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner Status
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Заявка на модерации
        </h1>

        {meQuery.isLoading ? (
          <p className="mt-4 text-[#6B7280]">Загружаем статус...</p>
        ) : partner ? (
          <div className="mt-5 rounded-[24px] bg-[#F9FAF8] p-5">
            <p className="font-bold text-[#17384B]">{partner.brandName}</p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Юридическое название: {partner.legalName}
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Статус:{" "}
              <span className="font-black text-[#FF7F6E]">{partner.status}</span>
            </p>
            {partner.rejectionReason && (
              <p className="mt-2 text-sm text-red-700">
                Причина: {partner.rejectionReason}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-[#6B7280]">
            У вашего аккаунта пока нет заявки партнёра.
          </p>
        )}

        <p className="mt-5 leading-7 text-[#6B7280]">
          После одобрения администратором появится доступ к кабинету партнёра:
          скидки, точки продаж, аналитика и история QR.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B]"
          >
            На главную
          </Link>
          <Link
            href="/partner/apply"
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
          >
            Подать заявку
          </Link>
        </div>
      </section>
    </div>
  );
}
