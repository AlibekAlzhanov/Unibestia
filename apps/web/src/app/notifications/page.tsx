"use client";

import Link from "next/link";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type NotificationItem = {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  sentAt: Date | string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
};

type NotificationsData = {
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
  items: NotificationItem[];
};

type FilterMode = "all" | "unread";

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    verification_status: "Верификация",
    offer_approved: "Оффер одобрен",
    offer_rejected: "Оффер отклонён",
    bonus_earned: "Бонусы",
    referral_reward: "Реферал",
    system: "Система",
  };

  return labels[type] ?? type;
}

function typeClass(type: string): string {
  if (type === "bonus_earned" || type === "referral_reward") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (type === "offer_rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (type === "offer_approved" || type === "verification_status") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function relatedLink(item: NotificationItem): string | null {
  if (!item.relatedEntityType || !item.relatedEntityId) {
    return null;
  }

  if (item.relatedEntityType === "offer") {
    return "/catalog";
  }

  if (item.relatedEntityType === "wallet") {
    return "/wallet";
  }

  if (item.relatedEntityType === "redemption") {
    return "/my-redemptions";
  }

  if (item.relatedEntityType === "verification") {
    return "/profile";
  }

  return null;
}

function LoadingNotifications(): JSX.Element {
  return (
    <section className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="ub-skeleton h-6 w-40 rounded-full" />
          <div className="ub-skeleton mt-5 h-6 w-2/3 rounded-full" />
          <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
        </article>
      ))}
    </section>
  );
}

function EmptyNotifications({ filter }: { filter: FilterMode }): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        🔔
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        {filter === "unread" ? "Непрочитанных нет" : "Уведомлений пока нет"}
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Здесь будут появляться события по статусу офферов, бонусам, QR-кодам,
        верификации и реферальной программе.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/catalog"
          className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Открыть каталог
        </Link>

        <Link
          href="/wallet"
          className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
        >
          Кошелёк
        </Link>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: number;
  hint: string;
  index: number;
}): JSX.Element {
  return (
    <article
      className={[
        "ub-animate-fade-up rounded-[30px] border border-white/15 bg-[linear-gradient(135deg,#17384B_0%,#255B73_70%,#FF9F8A_150%)] p-5 text-white shadow-[0_18px_42px_rgba(23,56,75,0.16)]",
        index === 1 ? "ub-delay-100" : "",
        index === 2 ? "ub-delay-200" : "",
      ].join(" ")}
    >
      <p className="text-sm font-bold text-[#DDE8EA]">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-[-0.04em]">{value}</p>
      <p className="mt-3 text-sm font-semibold text-[#FFB5A4]">{hint}</p>
    </article>
  );
}

function NotificationCard({
  item,
  onMarkAsRead,
  isMutating,
}: {
  item: NotificationItem;
  onMarkAsRead: (notificationId: string) => void;
  isMutating: boolean;
}): JSX.Element {
  const href = relatedLink(item);

  return (
    <article
      className={[
        "rounded-[30px] border p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition",
        item.isRead
          ? "border-[#E5ECE9] bg-white"
          : "border-[#FFB5A4] bg-[#FFF7F4]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                typeClass(item.type),
              ].join(" ")}
            >
              {typeLabel(item.type)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {item.channel}
            </span>

            {!item.isRead && (
              <span className="rounded-2xl bg-[#17384B] px-3 py-1 text-xs font-black text-white">
                unread
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-[#17384B]">
            {item.title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7280]">
            {item.body}
          </p>

          <div className="mt-4 grid gap-2 text-xs font-bold text-[#9CA3AF] sm:grid-cols-3">
            <p>Создано: {formatDateTime(item.createdAt)}</p>
            <p>Отправлено: {formatDateTime(item.sentAt)}</p>
            <p>Прочитано: {formatDateTime(item.readAt)}</p>
          </div>

          {item.relatedEntityType && item.relatedEntityId && (
            <p className="mt-3 break-all font-mono text-xs text-[#9CA3AF]">
              {item.relatedEntityType}: {item.relatedEntityId}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:w-[220px] lg:flex-col">
          {!item.isRead && (
            <button
              type="button"
              onClick={() => onMarkAsRead(item.id)}
              disabled={isMutating}
              className="rounded-2xl border border-[#D8E3DE] bg-white px-4 py-3 text-sm font-black text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Прочитано
            </button>
          )}

          {href && (
            <Link
              href={href}
              className="rounded-2xl bg-[#17384B] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#255B73]"
            >
              Открыть →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function NotificationsPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [filter, setFilter] = useState<FilterMode>("all");
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const notificationsQuery = useQuery({
    ...trpc.notifications.listMine.queryOptions({
      limit: 50,
      offset: 0,
      unreadOnly: filter === "unread",
    }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const data = notificationsQuery.data as NotificationsData | undefined;
  const notifications = useMemo(() => data?.items ?? [], [data?.items]);

  const totalCount = data?.total ?? notifications.length;
  const unreadCount = data?.unreadCount ?? 0;
  const readCount = Math.max(0, totalCount - unreadCount);

  async function markAsRead(notificationId: string): Promise<void> {
    setIsMutating(true);
    setErrorMessage(null);

    try {
      await trpcClient.notifications.markAsRead.mutate({ notificationId });
      await notificationsQuery.refetch();
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отметить уведомление прочитанным"
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function markAllAsRead(): Promise<void> {
    setIsMutating(true);
    setErrorMessage(null);

    try {
      await trpcClient.notifications.markAllAsRead.mutate();
      await notificationsQuery.refetch();
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отметить все уведомления прочитанными"
      );
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Notifications
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Уведомления UniBestia
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Здесь собраны важные события: результаты модерации, начисление
              бонусов, QR-активации, верификация и системные сообщения.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/catalog"
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                Каталог
              </Link>

              <Link
                href="/wallet"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15"
              >
                Кошелёк
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{unreadCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Unread
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{readCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Read
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Всего" value={totalCount} hint="все события" index={0} />
        <MetricCard label="Новые" value={unreadCount} hint="требуют внимания" index={1} />
        <MetricCard label="Прочитано" value={readCount} hint="закрытые события" index={2} />
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Фильтр
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              {filter === "all" ? "Все уведомления" : "Непрочитанные"}
            </h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition",
                filter === "all"
                  ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                  : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
              ].join(" ")}
            >
              Все
            </button>

            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition",
                filter === "unread"
                  ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                  : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
              ].join(" ")}
            >
              Непрочитанные
            </button>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={isMutating || unreadCount === 0}
              className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#17384B] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Прочитать всё
            </button>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {notificationsQuery.error && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Не удалось загрузить уведомления: {notificationsQuery.error.message}
        </div>
      )}

      {notificationsQuery.isLoading && !notificationsQuery.data ? (
        <LoadingNotifications />
      ) : notifications.length === 0 ? (
        <EmptyNotifications filter={filter} />
      ) : (
        <section className="grid gap-4">
          {notifications.map((item, index) => (
            <div
              key={item.id}
              className={[
                "ub-animate-fade-up",
                index === 1 ? "ub-delay-100" : "",
                index === 2 ? "ub-delay-200" : "",
              ].join(" ")}
            >
              <NotificationCard
                item={item}
                onMarkAsRead={(notificationId) => void markAsRead(notificationId)}
                isMutating={isMutating}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
