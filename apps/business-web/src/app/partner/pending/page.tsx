"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type JSX, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

function statusLabel(status?: string | null): string {
  const labels: Record<string, string> = {
    pending: "На модерации",
    approved: "Одобрен",
    rejected: "Отклонён",
    suspended: "Заблокирован",
    archived: "Архив",
  };

  return status ? labels[status] ?? status : "—";
}

function statusTitle(status?: string | null): string {
  if (status === "approved") {
    return "Заявка одобрена";
  }

  if (status === "rejected") {
    return "Заявка отклонена";
  }

  if (status === "suspended") {
    return "Аккаунт партнёра заблокирован";
  }

  if (status === "archived") {
    return "Заявка в архиве";
  }

  return "Заявка на модерации";
}

function statusDescription(status?: string | null): string {
  if (status === "approved") {
    return "Администратор одобрил заявку. Теперь доступен кабинет партнёра.";
  }

  if (status === "rejected") {
    return "Администратор отклонил заявку. Причина указана ниже.";
  }

  if (status === "suspended") {
    return "Партнёрский аккаунт временно заблокирован. Причина указана ниже.";
  }

  if (status === "archived") {
    return "Заявка или партнёрский аккаунт был перенесён в архив.";
  }

  return "После одобрения администратором появится доступ к кабинету партнёра: скидки, точки продаж, аналитика и история QR.";
}

export default function PartnerPendingPage(): JSX.Element {
  const router = useRouter();
  const trpc = useTRPC();
  const meQuery = useQuery(trpc.business.auth.getMe.queryOptions());

  const partner = meQuery.data?.partner;
  const status = partner?.status ?? null;

  useEffect(() => {
    if (meQuery.data?.businessAccess === "admin") {
      router.replace("/admin");
      return;
    }

    if (meQuery.data?.businessAccess === "partner") {
      router.replace("/partner");
    }
  }, [meQuery.data?.businessAccess, router]);

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[900px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-8 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Partner Status
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          {statusTitle(status)}
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
              <span className="font-black text-[#FF7F6E]">
                {statusLabel(partner.status)}
              </span>
            </p>
            {partner.rejectionReason && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <span className="font-black">Причина:</span>{" "}
                {partner.rejectionReason}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-[#6B7280]">
            У вашего аккаунта пока нет заявки партнёра.
          </p>
        )}

        <p className="mt-5 leading-7 text-[#6B7280]">
          {statusDescription(status)}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {status === "approved" && (
            <Link
              href="/partner"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Открыть кабинет
            </Link>
          )}

          {!partner && (
            <Link
              href="/partner/apply"
              className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
            >
              Подать заявку
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
            На главную
          </Link>
        </div>
      </section>
    </div>
  );
}