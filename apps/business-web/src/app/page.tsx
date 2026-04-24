"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type JSX, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export default function BusinessPortalEntryPage(): JSX.Element {
  const router = useRouter();
  const trpc = useTRPC();

  const meQuery = useQuery(trpc.business.auth.getMe.queryOptions());

  useEffect(() => {
    const access = meQuery.data?.businessAccess;

    if (!access) {
      return;
    }

    if (access === "admin") {
      router.replace("/admin");
      return;
    }

    if (access === "partner") {
      router.replace("/partner");
      return;
    }

    if (access === "partner_pending") {
      router.replace("/partner/pending");
      return;
    }

    if (
      access === "partner_rejected" ||
      access === "partner_suspended" ||
      access === "staff_mobile_only" ||
      access === "no_access"
    ) {
      router.replace("/access-denied");
    }
  }, [meQuery.data?.businessAccess, router]);

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[900px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-8 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          UniBestia Business
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Проверяем доступ к порталу
        </h1>

        {meQuery.isLoading ? (
          <p className="mt-4 text-[#6B7280]">
            Загружаем профиль и роли пользователя...
          </p>
        ) : meQuery.error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {meQuery.error.message}
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] bg-[#F9FAF8] p-5">
            <p className="font-bold text-[#17384B]">
              {meQuery.data?.user.displayName ?? meQuery.data?.user.email}
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Доступ: {meQuery.data?.businessAccess}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/partner/apply"
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white"
          >
            Подать заявку партнёра
          </Link>
          <Link
            href="/access-denied"
            className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B]"
          >
            Страница доступа
          </Link>
        </div>
      </section>
    </div>
  );
}
