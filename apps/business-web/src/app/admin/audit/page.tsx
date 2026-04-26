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

function actionClassName(action: string): string {
  if (action.includes("approved") || action.includes("published")) {
    return "rounded-xl bg-green-50 px-3 py-1 text-xs font-black text-green-700";
  }

  if (
    action.includes("rejected") ||
    action.includes("archived") ||
    action.includes("suspended") ||
    action.includes("blocked")
  ) {
    return "rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-red-700";
  }

  if (action.includes("created") || action.includes("submitted")) {
    return "rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700";
  }

  if (action.includes("validated") || action.includes("confirmed")) {
    return "rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700";
  }

  return "rounded-xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]";
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

  const auditQuery = useQuery(
    trpc.business.admin.listAuditLogs.queryOptions({
      actionGroup,
      entityType: entityType.trim() || undefined,
      actorRole: actorRole.trim() || undefined,
      limit,
      offset: 0,
    })
  );

  const logs = (auditQuery.data?.items ?? []) as AuditLogItem[];

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesDateRange = isInsideDateRange(log.createdAt, dateRange);

      if (!matchesDateRange) {
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

    const errors = filteredLogs.filter(
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
      errors,
      partner: byGroup.partner ?? 0,
      offer: byGroup.offer ?? 0,
      redemption: byGroup.redemption ?? 0,
      category: byGroup.category ?? 0,
      user: byGroup.user ?? 0,
    };
  }, [filteredLogs]);

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

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
              Admin / Audit
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#17384B]">
              Журнал аудита
            </h1>
            <p className="mt-3 max-w-3xl text-[#6B7280]">
              Расширенный просмотр audit_logs: фильтры, поиск, метрики,
              metadata и быстрый copy ID.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void auditQuery.refetch();
            }}
            className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            disabled={auditQuery.isFetching}
          >
            {auditQuery.isFetching ? "Обновляем..." : "Refresh"}
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Всего</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.total}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Success</p>
          <p className="mt-2 text-3xl font-black text-green-700">
            {metrics.success}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Risk / Reject</p>
          <p className="mt-2 text-3xl font-black text-red-700">
            {metrics.errors}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-bold text-[#6B7280]">Загружено</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {logs.length}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select
            value={actionGroup}
            onChange={(event) =>
              setActionGroup(event.target.value as ActionGroup)
            }
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none"
          >
            {actionGroups.map((group) => (
              <option key={group} value={group}>
                {actionGroupLabel(group)}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value as DateRange)}
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none"
          >
            {dateRanges.map((range) => (
              <option key={range} value={range}>
                {dateRangeLabel(range)}
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value) as LimitValue)}
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none"
          >
            {limits.map((value) => (
              <option key={value} value={value}>
                Limit {value}
              </option>
            ))}
          </select>

          <input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="entityType"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <input
            value={actorRole}
            onChange={(event) => setActorRole(event.target.value)}
            placeholder="actorRole"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск"
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#526470]">
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
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Не удалось загрузить аудит: {auditQuery.error.message}
        </div>
      )}

      <section className="mt-6 grid gap-4">
        {auditQuery.isLoading ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Загружаем аудит...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Записей аудита по выбранным фильтрам нет.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = Boolean(expandedLogIds[log.id]);
            const metadataText = stringifyMetadata(log.metadata);

            return (
              <article
                key={log.id}
                className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className={actionClassName(log.action)}>
                        {log.action}
                      </span>
                      <span className="rounded-xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
                        {log.entityType}
                      </span>
                      <span className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {log.actorRole ?? "system"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[#6B7280] md:grid-cols-2">
                      <p>
                        <span className="font-bold text-[#17384B]">Actor:</span>{" "}
                        {log.actorUser?.email ?? log.actorUserId ?? "—"}
                      </p>
                      <p>
                        <span className="font-bold text-[#17384B]">
                          Partner:
                        </span>{" "}
                        {log.partner?.brandName ?? log.partnerId ?? "—"}
                      </p>
                      <p>
                        <span className="font-bold text-[#17384B]">
                          Entity ID:
                        </span>{" "}
                        {log.entityId ?? "—"}
                      </p>
                      <p>
                        <span className="font-bold text-[#17384B]">
                          Created:
                        </span>{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(log.id)}
                        className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-xs font-bold text-[#526470]"
                      >
                        {isExpanded ? "Скрыть metadata" : "Показать metadata"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void copyText(log.id);
                        }}
                        className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-xs font-bold text-[#526470]"
                      >
                        {copiedId === log.id ? "Copied" : "Copy log ID"}
                      </button>

                      {log.entityId && (
                        <button
                          type="button"
                          onClick={() => {
                            void copyText(log.entityId ?? "");
                          }}
                          className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-2 text-xs font-bold text-[#526470]"
                        >
                          {copiedId === log.entityId ? "Copied" : "Copy entity ID"}
                        </button>
                      )}
                    </div>
                  </div>

                  <pre
                    className={
                      isExpanded
                        ? "max-h-[420px] overflow-auto rounded-2xl bg-[#0F172A] p-4 text-xs text-white xl:w-[500px]"
                        : "max-h-[96px] overflow-hidden rounded-2xl bg-[#0F172A] p-4 text-xs text-white xl:w-[500px]"
                    }
                  >
                    {metadataText || "{}"}
                  </pre>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}