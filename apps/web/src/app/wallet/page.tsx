"use client";

import Link from "next/link";
import { type JSX, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

type WalletData = {
  id: string;
  userId: string;
  availableBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type WalletTransaction = {
  id: string;
  walletId: string;
  userId: string;
  type: string;
  sourceType: string;
  sourceId: string | null;
  pointsDelta: number;
  balanceAfter: number;
  expiresAt: Date | string | null;
  comment: string | null;
  createdAt: Date | string;
};

type TransactionsData = {
  total: number;
  limit: number;
  offset: number;
  items: WalletTransaction[];
};

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function transactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    earn: "Начисление",
    spend: "Списание",
    expire: "Истечение",
    adjustment: "Корректировка",
    refund: "Возврат",
  };

  return labels[type] ?? type;
}

function sourceTypeLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    redemption: "QR-использование",
    referral: "Реферал",
    admin: "Админ",
    promotion: "Промо",
    manual: "Ручная операция",
  };

  return labels[sourceType] ?? sourceType;
}

function transactionClass(type: string): string {
  if (type === "earn" || type === "refund") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (type === "spend" || type === "expire") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function formatPoints(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
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

function EmptyTransactions(): JSX.Element {
  return (
    <div className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        ₸
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Транзакций пока нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Когда staff подтвердит QR-код, cashback или бонусы будут начислены в
        кошелёк и появятся в истории.
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

function HeroStatCard({
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

function BalanceInfoRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "danger";
}): JSX.Element {
  const valueClass =
    tone === "success"
      ? "text-green-700"
      : tone === "danger"
        ? "text-red-700"
        : "text-[#17384B]";

  return (
    <div className="flex items-center justify-between rounded-[22px] bg-[#F9FAF8] px-4 py-3">
      <span className="text-sm font-bold text-[#526470]">{label}</span>
      <span className={`text-sm font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function TransactionCard({
  transaction,
}: {
  transaction: WalletTransaction;
}): JSX.Element {
  return (
    <article className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-black",
                transactionClass(transaction.type),
              ].join(" ")}
            >
              {transactionTypeLabel(transaction.type)}
            </span>

            <span className="rounded-full bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
              {sourceTypeLabel(transaction.sourceType)}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-black text-[#17384B]">
            {transaction.comment ?? "Wallet transaction"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Баланс после операции:{" "}
            <span className="font-black text-[#17384B]">
              {transaction.balanceAfter}
            </span>{" "}
            баллов
          </p>

          <div className="mt-3 grid gap-2 text-xs font-bold text-[#9CA3AF] sm:grid-cols-2">
            <p>Создано: {formatDateTime(transaction.createdAt)}</p>
            <p>Истекает: {formatDateTime(transaction.expiresAt)}</p>
          </div>

          {transaction.sourceId && (
            <p className="mt-2 break-all font-mono text-xs text-[#9CA3AF]">
              source: {transaction.sourceId}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-2xl bg-[#F7F6F1] px-4 py-3 text-right">
          <p
            className={[
              "text-xl font-black",
              transaction.pointsDelta >= 0 ? "text-green-700" : "text-red-700",
            ].join(" ")}
          >
            {formatPoints(transaction.pointsDelta)}
          </p>

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
            points
          </p>
        </div>
      </div>
    </article>
  );
}

export default function WalletPage(): JSX.Element {
  const trpc = useTRPC();

  const walletQuery = useQuery({
    ...trpc.wallet.getMyWallet.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const transactionsQuery = useQuery({
    ...trpc.wallet.getMyTransactions.queryOptions({
      limit: 50,
      offset: 0,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const wallet = walletQuery.data as WalletData | undefined;

  const transactionsData = transactionsQuery.data as
    | TransactionsData
    | undefined;

  const transactions = useMemo(
    () => transactionsData?.items ?? [],
    [transactionsData?.items]
  );

  const earnCount = transactions.filter(
    (transaction) => transaction.type === "earn"
  ).length;

  const spendCount = transactions.filter(
    (transaction) => transaction.type === "spend"
  ).length;

  const latestTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();

      return second - first;
    });
  }, [transactions]);

  const isLoading = walletQuery.isLoading || transactionsQuery.isLoading;
  const error = walletQuery.error ?? transactionsQuery.error;

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
              Здесь отображается реальный баланс бонусов, lifetime-начисления,
              списания и история wallet transactions после подтверждения QR.
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
            <HeroStatCard
              label="Баланс"
              value={wallet?.availableBalance ?? 0}
              description="Доступные бонусные баллы."
            />

            <HeroStatCard
              label="Earned"
              value={wallet?.lifetimeEarned ?? 0}
              description="Всего начислено за всё время."
            />

            <HeroStatCard
              label="Spent"
              value={wallet?.lifetimeSpent ?? 0}
              description="Всего списано за всё время."
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingWallet />
      ) : error ? (
        <ErrorWallet message={error.message} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              Balance
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              Реальный баланс
            </h2>

            <div className="mt-6 rounded-[30px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_60%,#FF9F8A_140%)] p-6 text-white shadow-[0_20px_50px_rgba(23,56,75,0.2)]">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFB5A4]">
                Available balance
              </p>

              <p className="mt-3 text-5xl font-black">
                {wallet?.availableBalance ?? 0}
              </p>

              <p className="mt-3 text-sm leading-6 text-[#DDE8EA]">
                Баллы начисляются только после того, как staff подтверждает
                QR-код скидки.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <BalanceInfoRow
                label="Всего начислено"
                value={wallet?.lifetimeEarned ?? 0}
                tone="success"
              />

              <BalanceInfoRow
                label="Всего списано"
                value={wallet?.lifetimeSpent ?? 0}
                tone="danger"
              />

              <BalanceInfoRow
                label="Транзакций"
                value={transactionsData?.total ?? 0}
              />

              <BalanceInfoRow label="Earn operations" value={earnCount} />

              <BalanceInfoRow label="Spend operations" value={spendCount} />

              <BalanceInfoRow
                label="Обновлено"
                value={formatDateTime(wallet?.updatedAt)}
              />
            </div>

            <div className="mt-6 rounded-[26px] border border-[#FFE0D8] bg-[#FFF7F4] p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FF7F6E]">
                Wallet logic
              </p>

              <p className="mt-2 text-sm leading-7 text-[#8A4B3F]">
                QR created не меняет кошелёк. QR confirmed создаёт одну earn
                transaction. Повторное подтверждение не должно начислять баллы
                второй раз.
              </p>
            </div>
          </section>

          <section className="ub-animate-fade-up ub-delay-100 ub-card rounded-[34px] p-6 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Transactions
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  История кошелька
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Показано: {latestTransactions.length} из{" "}
                  {transactionsData?.total ?? 0}
                </p>
              </div>

              <Link
                href="/my-redemptions"
                className="text-sm font-black text-[#FF7F6E]"
              >
                Мои QR →
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {latestTransactions.length === 0 ? (
                <EmptyTransactions />
              ) : (
                latestTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}