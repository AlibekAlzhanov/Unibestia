"use client";

import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

const actionGroups = [
  "all",
  "partner",
  "offer",
  "redemption",
  "category",
  "user",
] as const;

const dateRanges = ["all", "today", "7d", "30d"] as const;
const limits = [25, 50, 100, 200] as const;

type ActionGroup = (typeof actionGroups)[number];
type DateRange = (typeof dateRanges)[number];
type LimitValue = (typeof limits)[number];

type AuditLogItem = {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  partnerId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | Date;
  actorUser: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  partner: {
    id: string;
    brandName: string;
    status: string;
  } | null;
};

const actionGroupOptions: Array<{ value: ActionGroup; label: string }> = [
  { value: "all", label: "Все" },
  { value: "partner", label: "Партнёры" },
  { value: "offer", label: "Офферы" },
  { value: "redemption", label: "QR" },
  { value: "category", label: "Категории" },
  { value: "user", label: "Пользователи" },
];

const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
  { value: "all", label: "За всё время" },
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
];

function actionGroupLabel(value: string): string {
  const labels: Record<string, string> = {
    all: "Все",
    partner: "Партнёры",
    offer: "Офферы",
    redemption: "QR / Redemption",
    category: "Категории",
    user: "Пользователи",
  };

  return labels[value] ?? value;
}

function dateRangeLabel(value: string): string {
  const labels: Record<string, string> = {
    all: "За всё время",
    today: "Сегодня",
    "7d": "7 дней",
    "30d": "30 дней",
  };

  return labels[value] ?? value;
}

function actionClass(action: string): string {
  if (action.includes("approved") || action.includes("published")) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    action.includes("rejected") ||
    action.includes("archived") ||
    action.includes("suspended") ||
    action.includes("blocked")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (action.includes("created") || action.includes("submitted")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (action.includes("validated") || action.includes("confirmed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-[#FFD8CE] bg-[#FFF0EB] text-[#FF7F6E]";
}

function isInsideDateRange(createdAt: string | Date, range: DateRange): boolean {
  if (range === "all") {
    return true;
  }

  const date = new Date(createdAt);
  const now = new Date();

  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }

  const days = range === "7d" ? 7 : 30;
  const minDate = new Date(now);
  minDate.setDate(now.getDate() - days);

  return date >= minDate;
}

function stringifyMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) {
    return "";
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

function getActionGroup(action: string): string {
  return action.split(".")[0] ?? "other";
}

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("ru-RU");
}

function LoadingAudit(): JSX.Element {
  return (
    <section className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_500px]">
            <div>
              <div className="ub-skeleton h-7 w-40 rounded-full" />
              <div className="ub-skeleton mt-5 h-4 w-full rounded-full" />
              <div className="ub-skeleton mt-3 h-4 w-2/3 rounded-full" />
              <div className="ub-skeleton mt-5 h-10 w-60 rounded-2xl" />
            </div>

            <div className="ub-skeleton h-[120px] rounded-2xl" />
          </div>
        </article>
      ))}
    </section>
  );
}

function EmptyAudit({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        LOG
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Записей аудита нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        {hasFilters
          ? "По выбранным фильтрам ничего не найдено. Попробуй расширить период или очистить поиск."
          : "Когда администратор, партнёр или staff выполнит действие, запись появится здесь."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
        >
          Сбросить фильтры
        </button>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "danger";
}): JSX.Element {
  const valueClass =
    tone === "success"
      ? "text-green-700"
      : tone === "danger"
        ? "text-red-700"
        : "text-[#17384B]";

  return (
    <article className="ub-card rounded-[28px] p-5">
      <p className="text-sm font-bold text-[#6B7280]">{label}</p>
      <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
    </article>
  );
}

function AuditLogCard({
  log,
  isExpanded,
  copiedId,
  onToggleExpanded,
  onCopy,
}: {
  log: AuditLogItem;
  isExpanded: boolean;
  copiedId: string | null;
  onToggleExpanded: () => void;
  onCopy: (value: string) => void;
}): JSX.Element {
  const metadataText = stringifyMetadata(log.metadata);

  return (
    <article className="ub-card rounded-[30px] p-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_500px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                actionClass(log.action),
              ].join(" ")}
            >
              {log.action}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {log.entityType}
            </span>

            <span className="rounded-2xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              {log.actorRole ?? "system"}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black text-[#17384B]">
            {actionGroupLabel(getActionGroup(log.action))}
          </h2>

          <div className="mt-5 grid gap-3 text-sm text-[#6B7280] md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Actor
              </p>
              <p className="mt-1 break-all font-bold text-[#17384B]">
                {log.actorUser?.email ?? log.actorUserId ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Partner
              </p>
              <p className="mt-1 break-all font-bold text-[#17384B]">
                {log.partner?.brandName ?? log.partnerId ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Entity ID
              </p>
              <p className="mt-1 break-all font-bold text-[#17384B]">
                {log.entityId ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9FAF8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
                Created
              </p>
              <p className="mt-1 font-bold text-[#17384B]">
                {formatDateTime(log.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-xs font-black text-[#526470] transition hover:bg-white"
            >
              {isExpanded ? "Скрыть metadata" : "Показать metadata"}
            </button>

            <button
              type="button"
              onClick={() => onCopy(log.id)}
              className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-xs font-black text-[#526470] transition hover:bg-white"
            >
              {copiedId === log.id ? "Copied" : "Copy log ID"}
            </button>

            {log.entityId && (
              <button
                type="button"
                onClick={() => onCopy(log.entityId ?? "")}
                className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-xs font-black text-[#526470] transition hover:bg-white"
              >
                {copiedId === log.entityId ? "Copied" : "Copy entity ID"}
              </button>
            )}
          </div>
        </div>

        <pre
          className={[
            "overflow-auto rounded-2xl bg-[#0F172A] p-4 text-xs leading-6 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
            isExpanded ? "max-h-[420px]" : "max-h-[120px]",
          ].join(" ")}
        >
          {metadataText || "{}"}
        </pre>
      </div>
    </article>
  );
}

export default function AdminAuditPage(): JSX.Element {
  const trpc = useTRPC();

  const [actionGroup, setActionGroup] = useState<ActionGroup>("all");
  const [entityType, setEntityType] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [limit, setLimit] = useState<LimitValue>(100);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>(
    {}
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const auditQuery = useQuery({
    ...trpc.business.admin.listAuditLogs.queryOptions({
      actionGroup,
      entityType: entityType.trim() || undefined,
      actorRole: actorRole.trim() || undefined,
      limit,
      offset: 0,
    }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const logs = (auditQuery.data?.items ?? []) as AuditLogItem[];

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (!isInsideDateRange(log.createdAt, dateRange)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const metadataText = stringifyMetadata(log.metadata).toLowerCase();

      const searchable = [
        log.id,
        log.action,
        log.actorRole,
        log.actorUser?.email,
        log.actorUser?.displayName,
        log.entityType,
        log.entityId,
        log.partner?.brandName,
        log.partner?.status,
        log.partnerId,
        metadataText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [logs, search, dateRange]);

  const metrics = useMemo(() => {
    const byGroup = filteredLogs.reduce<Record<string, number>>((acc, log) => {
      const group = getActionGroup(log.action);
      acc[group] = (acc[group] ?? 0) + 1;
      return acc;
    }, {});

    const risk = filteredLogs.filter(
      (log) =>
        log.action.includes("rejected") ||
        log.action.includes("archived") ||
        log.action.includes("suspended") ||
        log.action.includes("blocked")
    ).length;

    const success = filteredLogs.filter(
      (log) =>
        log.action.includes("approved") ||
        log.action.includes("published") ||
        log.action.includes("confirmed") ||
        log.action.includes("created")
    ).length;

    return {
      total: filteredLogs.length,
      success,
      risk,
      partner: byGroup.partner ?? 0,
      offer: byGroup.offer ?? 0,
      redemption: byGroup.redemption ?? 0,
      category: byGroup.category ?? 0,
      user: byGroup.user ?? 0,
    };
  }, [filteredLogs]);

  const hasFilters =
    actionGroup !== "all" ||
    dateRange !== "all" ||
    entityType.trim().length > 0 ||
    actorRole.trim().length > 0 ||
    search.trim().length > 0 ||
    limit !== 100;

  function toggleExpanded(logId: string): void {
    setExpandedLogIds((current) => ({
      ...current,
      [logId]: !current[logId],
    }));
  }

  async function copyText(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(value);

      setTimeout(() => {
        setCopiedId(null);
      }, 1200);
    } catch {
      setCopiedId(null);
    }
  }

  function resetFilters(): void {
    setActionGroup("all");
    setEntityType("");
    setActorRole("");
    setSearch("");
    setDateRange("all");
    setLimit(100);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin / Audit
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Журнал аудита
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Расширенный просмотр audit_logs: фильтры, поиск, metadata,
              быстрый copy ID и контроль действий администраторов, партнёров и
              сотрудников.
            </p>

            <button
              type="button"
              onClick={() => {
                void auditQuery.refetch();
              }}
              className="ub-gradient-button mt-7 rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={auditQuery.isFetching}
            >
              {auditQuery.isFetching ? "Обновляем..." : "Обновить журнал"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{metrics.total}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Events
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{metrics.success}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Success
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{metrics.risk}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Risk
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Всего" value={metrics.total} tone="default" />
        <MetricCard label="Success" value={metrics.success} tone="success" />
        <MetricCard label="Risk / Reject" value={metrics.risk} tone="danger" />
        <MetricCard label="Загружено" value={logs.length} tone="default" />
      </section>

      <section className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px] xl:items-end">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Поиск
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ID, action, actor, partner, metadata..."
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Entity type
            </span>

            <input
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              placeholder="partner / offer / user"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Actor role
            </span>

            <input
              value={actorRole}
              onChange={(event) => setActorRole(event.target.value)}
              placeholder="admin / partner / staff"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          {actionGroupOptions.map((option) => {
            const isActive = actionGroup === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setActionGroup(option.value)}
                className={[
                  "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                  isActive
                    ? "bg-[#17384B] text-white shadow-[0_12px_26px_rgba(23,56,75,0.18)]"
                    : "border border-[#E5ECE9] bg-white text-[#526470] hover:border-[#FFB5A4] hover:text-[#17384B]",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => {
            const isActive = dateRange === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDateRange(option.value)}
                className={[
                  "rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                  isActive
                    ? "bg-[#FFF0EB] text-[#FF7F6E]"
                    : "bg-[#F7F6F1] text-[#526470] hover:bg-[#FFF0EB] hover:text-[#FF7F6E]",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}

          {limits.map((value) => {
            const isActive = limit === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setLimit(value)}
                className={[
                  "rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition",
                  isActive
                    ? "bg-[#17384B] text-white"
                    : "bg-[#F7F6F1] text-[#526470] hover:bg-[#FFF0EB] hover:text-[#FF7F6E]",
                ].join(" ")}
              >
                {value}
              </button>
            );
          })}

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#17384B] transition hover:border-[#FFB5A4] hover:bg-[#F7F6F1]"
          >
            Сбросить
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#526470]">
          <span className="rounded-xl bg-[#F7F6F1] px-3 py-1">
            partner: {metrics.partner}
          </span>
          <span className="rounded-xl bg-[#F7F6F1] px-3 py-1">
            offer: {metrics.offer}
          </span>
          <span className="rounded-xl bg-[#F7F6F1] px-3 py-1">
            redemption: {metrics.redemption}
          </span>
          <span className="rounded-xl bg-[#F7F6F1] px-3 py-1">
            category: {metrics.category}
          </span>
          <span className="rounded-xl bg-[#F7F6F1] px-3 py-1">
            user: {metrics.user}
          </span>
        </div>

        <p className="mt-3 text-sm text-[#6B7280]">
          Backend total: {auditQuery.data?.total ?? 0}. Показано после локальных
          фильтров: {filteredLogs.length}.
        </p>
      </section>

      {auditQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить аудит: {auditQuery.error.message}
        </div>
      )}

      {auditQuery.isLoading && !auditQuery.data ? (
        <LoadingAudit />
      ) : filteredLogs.length === 0 ? (
        <EmptyAudit hasFilters={hasFilters} onReset={resetFilters} />
      ) : (
        <section className="grid gap-4">
          {filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className={[
                "ub-animate-fade-up",
                index === 1 ? "ub-delay-100" : "",
                index === 2 ? "ub-delay-200" : "",
              ].join(" ")}
            >
              <AuditLogCard
                log={log}
                isExpanded={Boolean(expandedLogIds[log.id])}
                copiedId={copiedId}
                onToggleExpanded={() => toggleExpanded(log.id)}
                onCopy={(value) => {
                  void copyText(value);
                }}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}