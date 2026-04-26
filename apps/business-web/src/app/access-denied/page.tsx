"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

function accessTitle(access?: string): string {
  if (access === "staff_mobile_only") {
    return "Доступ только через staff app";
  }

  if (access === "partner_rejected") {
    return "Заявка партнёра отклонена";
  }

  if (access === "partner_suspended") {
    return "Партнёрский аккаунт заблокирован";
  }

  if (access === "partner_pending") {
    return "Заявка ожидает модерации";
  }

  return "Нет доступа к Business Portal";
}

function accessText(access?: string): string {
  if (access === "staff_mobile_only") {
    return "У вас роль сотрудника. Для сканирования QR нужно использовать staff mobile app.";
  }

  if (access === "partner_rejected") {
    return "Администратор отклонил заявку партнёра. Если данные исправлены, обратитесь к администратору для восстановления или повторной проверки.";
  }

  if (access === "partner_suspended") {
    return "Аккаунт партнёра временно заблокирован. Управление скидками и аналитикой недоступно до восстановления.";
  }

  if (access === "partner_pending") {
    return "Заявка партнёра ещё ожидает модерации. После одобрения появится доступ к кабинету партнёра.";
  }

  return "Этот портал предназначен для администраторов и партнёров UniBestia.";
}

export default function AccessDeniedPage(): JSX.Element {
  const trpc = useTRPC();
  const meQuery = useQuery(trpc.business.auth.getMe.queryOptions());

  const access = meQuery.data?.businessAccess;
  const partner = meQuery.data?.partner;
  const canApply = !meQuery.data?.membership && access === "no_access";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[900px] items-center px-4 py-10 md:px-6 lg:px-8">
      <section className="w-full rounded-[32px] bg-white p-8 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Access denied
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          {accessTitle(access)}
        </h1>
        <p className="mt-4 leading-7 text-[#6B7280]">
          {accessText(access)}
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
            {partner && (
              <>
                <p className="mt-1">
                  <span className="font-bold text-[#17384B]">Партнёр:</span>{" "}
                  {partner.brandName} ({partner.status})
                </p>
                {partner.rejectionReason && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <span className="font-black">Причина:</span>{" "}
                    {partner.rejectionReason}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {access === "partner_pending" && (
            <Link
              href="/partner/pending"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Проверить заявку
            </Link>
          )}

          {(access === "partner_rejected" ||
            access === "partner_suspended") && (
            <Link
              href="/partner/pending"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Посмотреть статус
            </Link>
          )}

          {canApply && (
            <Link
              href="/partner/apply"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Подать заявку партнёра
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              void meQuery.refetch();
            }}
            className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B]"
          >
            Обновить статус
          </button>

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