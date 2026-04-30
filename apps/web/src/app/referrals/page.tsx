"use client";

import Link from "next/link";
import { type FormEvent, type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type ReferralReward = {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCodeId: string;
  status: string;
  referrerRewardPoints: number;
  referredRewardPoints: number;
  rewardedAt: Date | string | null;
  createdAt: Date | string;
  referredUser?: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

type ReferralSummary = {
  referralCode: {
    id: string;
    code: string;
    isActive: boolean;
    createdAt: Date | string;
  };
  stats: {
    invitedCount: number;
    rewardedCount: number;
    pendingCount: number;
    earnedPoints: number;
    availableBalance: number;
  };
  rewardsAsReferrer: ReferralReward[];
  myAppliedReferral: (ReferralReward & {
    referrerUser?: {
      id: string;
      email: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
    } | null;
    referralCode?: {
      id: string;
      code: string;
    } | null;
  }) | null;
};

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    registered: "Ожидает верификации",
    verified: "Верифицирован",
    rewarded: "Бонус начислен",
    cancelled: "Отменён",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "rewarded") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "registered" || status === "verified") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function invitedUserName(reward: ReferralReward): string {
  const user = reward.referredUser;

  if (!user) {
    return "Приглашённый студент";
  }

  return (
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

function LoadingReferrals(): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-7 w-52 rounded-full" />
        <div className="ub-skeleton mt-6 h-16 w-full rounded-[24px]" />
        <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
      </section>

      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-7 w-36 rounded-full" />
        <div className="ub-skeleton mt-6 h-12 w-full rounded-2xl" />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}): JSX.Element {
  return (
    <article className="rounded-[28px] border border-white/15 bg-white/12 p-5 text-white backdrop-blur-md">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#DDE8EA]">{hint}</p>
    </article>
  );
}

function RewardCard({ reward }: { reward: ReferralReward }): JSX.Element {
  return (
    <article className="rounded-[24px] border border-[#E5ECE9] bg-white p-4 transition hover:border-[#FFB5A4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span
            className={[
              "rounded-2xl border px-3 py-1 text-xs font-black",
              statusClass(reward.status),
            ].join(" ")}
          >
            {statusLabel(reward.status)}
          </span>

          <h3 className="mt-3 text-base font-black text-[#17384B]">
            {invitedUserName(reward)}
          </h3>

          <p className="mt-1 break-all text-sm leading-6 text-[#6B7280]">
            {reward.referredUser?.email ?? "email скрыт"}
          </p>

          <p className="mt-2 text-xs font-bold text-[#9CA3AF]">
            Создано: {formatDateTime(reward.createdAt)}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-[#F7F6F1] px-4 py-3 text-right">
          <p className="text-xl font-black text-green-700">
            +{reward.referrerRewardPoints}
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
            points
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ReferralsPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [codeInput, setCodeInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const summaryQuery = useQuery({
    ...trpc.referrals.getMyReferralSummary.queryOptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const summary = summaryQuery.data as ReferralSummary | undefined;

  const inviteUrl = useMemo(() => {
    if (!summary?.referralCode.code) {
      return "";
    }

    if (typeof window === "undefined") {
      return summary.referralCode.code;
    }

    return `${window.location.origin}/register?ref=${summary.referralCode.code}`;
  }, [summary?.referralCode.code]);

  async function copyReferralCode(): Promise<void> {
    if (!summary?.referralCode.code) {
      return;
    }

    await navigator.clipboard.writeText(summary.referralCode.code);
    setIsCopied(true);

    window.setTimeout(() => setIsCopied(false), 1600);
  }

  async function copyInviteUrl(): Promise<void> {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);

    window.setTimeout(() => setIsCopied(false), 1600);
  }

  async function applyReferralCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsApplying(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const result = await trpcClient.referrals.applyReferralCode.mutate({
        code: codeInput,
      });

      setCodeInput("");
      setMessage(result.message);
      await summaryQuery.refetch();
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось применить referral code"
      );
    } finally {
      setIsApplying(false);
    }
  }

  async function claimRewards(): Promise<void> {
    setIsClaiming(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const result =
        await trpcClient.referrals.claimVerifiedReferralRewards.mutate();

      setMessage(
        result.claimed.length > 0
          ? `Начислено реферальных бонусов: ${result.claimed.length}`
          : "Пока нет доступных бонусов. Приглашённый студент должен пройти верификацию."
      );

      await summaryQuery.refetch();
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось проверить реферальные бонусы"
      );
    } finally {
      setIsClaiming(false);
    }
  }

  if (summaryQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <LoadingReferrals />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Referral program
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Приглашай студентов и получай бонусы
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Делись referral code с друзьями. Когда приглашённый студент
              зарегистрируется и пройдёт верификацию, бонусы начисляются в
              кошелёк обоим пользователям.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => void copyReferralCode()}
                className="ub-gradient-button rounded-2xl px-5 py-3 text-center text-sm font-black text-white"
              >
                {isCopied ? "Скопировано" : "Скопировать код"}
              </button>

              <button
                type="button"
                onClick={() => void claimRewards()}
                disabled={isClaiming}
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isClaiming ? "Проверяем..." : "Проверить бонусы"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
              Your code
            </p>

            <p className="mt-3 break-all rounded-[24px] bg-white/12 px-4 py-4 text-3xl font-black tracking-[0.08em] text-white">
              {summary?.referralCode.code ?? "—"}
            </p>

            <button
              type="button"
              onClick={() => void copyInviteUrl()}
              className="mt-4 w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
            >
              Скопировать invite link
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 md:grid-cols-4">
          <MetricCard
            label="Приглашено"
            value={summary?.stats.invitedCount ?? 0}
            hint="всего применений кода"
          />

          <MetricCard
            label="Начислено"
            value={summary?.stats.rewardedCount ?? 0}
            hint="успешные verified rewards"
          />

          <MetricCard
            label="Ожидают"
            value={summary?.stats.pendingCount ?? 0}
            hint="нужна верификация"
          />

          <MetricCard
            label="Баланс"
            value={summary?.stats.availableBalance ?? 0}
            hint="points в кошельке"
          />
        </div>
      </section>

      {summaryQuery.error && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Не удалось загрузить referral data: {summaryQuery.error.message}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <form
          onSubmit={applyReferralCode}
          className="ub-animate-fade-up ub-card rounded-[34px] p-6 md:p-7"
        >
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Apply code
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Ввести referral code
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#6B7280]">
            Если тебя пригласил другой студент, введи его код. Бонусы
            начислятся после прохождения верификации.
          </p>

          {summary?.myAppliedReferral ? (
            <div className="mt-6 rounded-[26px] border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-black text-green-700">
                Referral code уже применён
              </p>

              <p className="mt-2 text-sm leading-7 text-green-700">
                Код:{" "}
                <span className="font-black">
                  {summary.myAppliedReferral.referralCode?.code ?? "—"}
                </span>
              </p>

              <p className="mt-2 text-sm leading-7 text-green-700">
                Статус: {statusLabel(summary.myAppliedReferral.status)}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Referral code
                </span>

                <input
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  required
                  minLength={4}
                  maxLength={50}
                  placeholder="ALI123ABC"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold uppercase text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <button
                type="submit"
                disabled={isApplying}
                className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplying ? "Применяем..." : "Применить код"}
              </button>
            </div>
          )}
        </form>

        <section className="ub-animate-fade-up ub-delay-100 ub-card rounded-[34px] p-6 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                Invites
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                История приглашений
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Показано: {summary?.rewardsAsReferrer.length ?? 0}
              </p>
            </div>

            <Link href="/wallet" className="text-sm font-black text-[#FF7F6E]">
              Кошелёк →
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {!summary || summary.rewardsAsReferrer.length === 0 ? (
              <div className="rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#FFF0EB] text-xl font-black text-[#FF7F6E]">
                  INV
                </div>

                <h3 className="mt-4 text-xl font-black text-[#17384B]">
                  Приглашений пока нет
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6B7280]">
                  Скопируй referral code и отправь другу. После применения кода
                  запись появится здесь.
                </p>
              </div>
            ) : (
              summary.rewardsAsReferrer.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
