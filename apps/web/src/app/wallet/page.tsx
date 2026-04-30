"use client";

import Link from "next/link";
import { type JSX, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type RedemptionItem = {
  id: string;
  status: string;
  qrToken: string;
  qrExpiresAt?: Date | string | null;
  usedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  createdAt?: Date | string | null;
  offer?: {
    slug?: string | null;
    title?: string | null;
    shortDescription?: string | null;
    bonusRewardPoints?: number | null;
    cashbackPercent?: string | null;
    discountType?: string | null;
    discountValue?: string | null;
  } | null;
  location?: {
    name?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
};

type WalletEvent = {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: "bonus" | "cashback" | "discount" | "qr";
  date: Date | string | null | undefined;
  status: string;
  href?: string;
};

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "не указано";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function isActiveRedemption(item: RedemptionItem): boolean {
  return item.status === "created" || item.status === "confirmed";
}

function getEstimatedBenefit(item: RedemptionItem): number {
  const offer = item.offer;

  if (!offer) {
    return 0;
  }

  if (offer.bonusRewardPoints) {
    return offer.bonusRewardPoints;
  }

  if (offer.cashbackPercent) {
    return Number(offer.cashbackPercent);
  }

  if (offer.discountType === "percent" && offer.discountValue) {
    return Number(offer.discountValue);
  }

  if (offer.discountType === "fixed_amount" && offer.discountValue) {
    return Math.round(Number(offer.discountValue) / 100);
  }

  return 0;
}

function getWalletEvents(items: RedemptionItem[]): WalletEvent[] {
  return items.map((item) => {
    const benefit = getEstimatedBenefit(item);
    const title = item.offer?.title ?? "Скидка UniBestia";
    const location = item.location?.name ?? "Локация не указана";

    if (item.status === "used") {
      return {
        id: item.id,
        title,
        description: `Скидка использована: ${location}`,
        amount: benefit,
        type: "discount",
        date: item.usedAt ?? item.createdAt,
        status: item.status,
        href: item.offer?.slug ? `/offer/${item.offer.slug}` : undefined,
      };
    }

    if (isActiveRedemption(item)) {
      return {
        id: item.id,
        title,
        description: `QR-код активен: ${location}`,
        amount: benefit,
        type: "qr",
        date: item.createdAt,
        status: item.status,
        href: item.offer?.slug ? `/offer/${item.offer.slug}` : undefined,
      };
    }

    return {
      id: item.id,
      title,
      description: `Статус QR: ${item.status}`,
      amount: benefit,
      type: "qr",
      date: item.createdAt,
      status: item.status,
      href: item.offer?.slug ? `/offer/${item.offer.slug}` : undefined,
    };
  });
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    created: "Создан",
    confirmed: "Подтверждён",
    used: "Использован",
    expired: "Истёк",
    cancelled: "Отменён",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "created" || status === "confirmed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "used") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "expired" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function eventTypeLabel(type: WalletEvent["type"]): string {
  const labels: Record<WalletEvent["type"], string> = {
    bonus: "Бонус",
    cashback: "Cashback",
    discount: "Скидка",
    qr: "QR",
  };

  return labels[type];
}

function LoadingWallet(): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-5 w-44 rounded-full" />
        <div className="ub-skeleton mt-6 h-14 w-40 rounded-full" />
        <div className="ub-skeleton mt-5 h-4 w-full rounded-full" />
        <div className="ub-skeleton mt-3 h-4 w-2/3 rounded-full" />
      </section>

      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-6 w-52 rounded-full" />
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-[#F9FAF8] p-4">
              <div className="ub-skeleton h-4 w-3/4 rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyWallet(): JSX.Element {
  return (
    <div className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        ₸
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Кошелёк пока пустой
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Когда ты начнёшь получать QR-коды, использовать скидки и копить бонусы,
        история появится здесь.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/catalog"
          className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Перейти в каталог
        </Link>

        <Link
          href="/my-redemptions"
          className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
        >
          Мои QR
        </Link>
      </div>
    </div>
  );
}

function ErrorWallet({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-red-700">
      <p className="text-sm font-black uppercase tracking-[0.14em]">
        Ошибка загрузки
      </p>

      <p className="mt-2 text-sm leading-6">
        Не удалось загрузить кошелёк: {message}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}): JSX.Element {
  return (
    <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
        {label}
      </p>
      <p className="mt-2 hidden text-xs leading-5 text-[#DDE8EA] lg:block">
        {description}
      </p>
    </div>
  );
}

function WalletEventCard({ event }: { event: WalletEvent }): JSX.Element {
  const content = (
    <article className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
              {eventTypeLabel(event.type)}
            </span>

            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-black",
                statusClass(event.status),
              ].join(" ")}
            >
              {statusLabel(event.status)}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-black text-[#17384B]">
            {event.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            {event.description}
          </p>

          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
            {formatDateTime(event.date)}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-[#F7F6F1] px-4 py-3 text-right">
          <p className="text-xl font-black text-[#17384B]">
            {event.amount > 0 ? `+${event.amount}` : "—"}
          </p>

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
            benefit
          </p>
        </div>
      </div>
    </article>
  );

  if (!event.href) {
    return content;
  }

  return (
    <Link href={event.href} className="block">
      {content}
    </Link>
  );
}

export default function WalletPage(): JSX.Element {
  const trpc = useTRPC();

  const redemptionsQuery = useQuery(
    trpc.redemptions.listMine.queryOptions({
      limit: 50,
      offset: 0,
    })
  );

  const items = useMemo(
    () => (redemptionsQuery.data?.items ?? []) as RedemptionItem[],
    [redemptionsQuery.data?.items]
  );

  const events = useMemo(() => getWalletEvents(items), [items]);

  const activeQrCount = items.filter((item) => isActiveRedemption(item)).length;
  const usedCount = items.filter((item) => item.status === "used").length;
  const expiredCount = items.filter(
    (item) => item.status === "expired" || item.status === "cancelled"
  ).length;

  const estimatedBenefits = events.reduce((sum, event) => sum + event.amount, 0);

  const latestEvents = [...events].sort((a, b) => {
    const first = a.date ? new Date(a.date).getTime() : 0;
    const second = b.date ? new Date(b.date).getTime() : 0;

    return second - first;
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Wallet
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Кошелёк UniBestia
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Здесь отображается твоя активность: полученные QR-коды,
              использованные скидки и ориентировочная накопленная выгода.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/catalog"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Найти скидку
              </Link>

              <Link
                href="/my-redemptions"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Мои QR
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <StatCard
              label="Активные"
              value={activeQrCount}
              description="QR-коды, которые можно показать партнёру."
            />

            <StatCard
              label="Использованы"
              value={usedCount}
              description="Скидки, которые уже были применены."
            />

            <StatCard
              label="Истекли"
              value={expiredCount}
              description="Неактивные или отменённые QR-коды."
            />
          </div>
        </div>
      </section>

      {redemptionsQuery.isLoading ? (
        <LoadingWallet />
      ) : redemptionsQuery.error ? (
        <ErrorWallet message={redemptionsQuery.error.message} />
      ) : events.length === 0 ? (
        <EmptyWallet />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Balance
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Баланс активности
            </h2>

            <div className="mt-6 rounded-[30px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_60%,#FF9F8A_140%)] p-6 text-white shadow-[0_20px_50px_rgba(23,56,75,0.2)]">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFB5A4]">
                Ориентировочная выгода
              </p>

              <p className="mt-3 text-5xl font-black">{estimatedBenefits}</p>

              <p className="mt-3 text-sm leading-6 text-[#DDE8EA]">
                Значение рассчитывается по данным QR и скидок. Для точного
                бонусного баланса позже можно добавить отдельный backend-модуль
                wallet.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="flex items-center justify-between rounded-[22px] bg-[#F9FAF8] px-4 py-3">
                <span className="text-sm font-bold text-[#526470]">
                  Всего операций
                </span>
                <span className="text-sm font-black text-[#17384B]">
                  {events.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[22px] bg-[#F9FAF8] px-4 py-3">
                <span className="text-sm font-bold text-[#526470]">
                  Активные QR
                </span>
                <span className="text-sm font-black text-green-700">
                  {activeQrCount}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[22px] bg-[#F9FAF8] px-4 py-3">
                <span className="text-sm font-bold text-[#526470]">
                  Использованные
                </span>
                <span className="text-sm font-black text-blue-700">
                  {usedCount}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[26px] border border-[#FFE0D8] bg-[#FFF7F4] p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FF7F6E]">
                Следующий backend-этап
              </p>

              <p className="mt-2 text-sm leading-7 text-[#8A4B3F]">
                Позже можно добавить настоящие таблицы wallet_transactions,
                bonus_balance и cashback_history. Сейчас страница показывает
                frontend-кошелёк на основе истории QR.
              </p>
            </div>
          </section>

          <section className="ub-animate-fade-up ub-delay-100 ub-card rounded-[34px] p-6 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  History
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  История операций
                </h2>
              </div>

              <Link
                href="/my-redemptions"
                className="text-sm font-black text-[#FF7F6E]"
              >
                Все QR →
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {latestEvents.map((event) => (
                <WalletEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}