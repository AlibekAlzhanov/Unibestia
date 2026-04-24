"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

function accessText(access?: string): string {
  if (access === "staff_mobile_only") {
    return "У вас роль сотрудника. Для сканирования QR нужно использовать staff mobile app.";
  }

  if (access === "partner_rejected") {
    return "Заявка партнёра отклонена администратором.";
  }

  if (access === "partner_suspended") {
    return "Аккаунт партнёра заблокирован.";
  }

  if (access === "partner_pending") {
    return "Заявка партнёра ещё ожидает модерации.";
  }

  return "Этот портал предназначен для администраторов и партнёров UniBestia.";
}

export default function AccessDeniedPage(): JSX.Element {
  const trpc = useTRPC();
  const meQuery = useQuery(trpc.business.auth.getMe.queryOptions());

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] items-center px-4 py-10 md:px-6 lg:px-8">
      <section className="w-full rounded-[32px] bg-white p-8 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Access denied
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Нет доступа к Business Portal
        </h1>
        <p className="mt-4 leading-7 text-[#6B7280]">
          {accessText(meQuery.data?.businessAccess)}
        </p>

        {meQuery.data && (
          <div className="mt-5 rounded-[24px] bg-[#F9FAF8] p-5 text-sm text-[#6B7280]">
            <p>
              <span className="font-bold text-[#17384B]">Пользователь:</span>{" "}
              {meQuery.data.user.email}
            </p>
            <p className="mt-1">
              <span className="font-bold text-[#17384B]">Доступ:</span>{" "}
              {meQuery.data.businessAccess}
            </p>
            {meQuery.data.partner && (
              <p className="mt-1">
                <span className="font-bold text-[#17384B]">Партнёр:</span>{" "}
                {meQuery.data.partner.brandName} ({meQuery.data.partner.status})
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {meQuery.data?.businessAccess === "partner_pending" ? (
            <Link
              href="/partner/pending"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Проверить заявку
            </Link>
          ) : (
            <Link
              href="/partner/apply"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Подать заявку партнёра
            </Link>
          )}
          <Link
            href="/"
            className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B]"
          >
            Вернуться на портал
          </Link>
        </div>
      </section>
    </div>
  );
}
