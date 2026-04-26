"use client";

import { type JSX, useState } from "react";
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

type ActionGroup = (typeof actionGroups)[number];

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

export default function AdminAuditPage(): JSX.Element {
  const trpc = useTRPC();

  const [actionGroup, setActionGroup] = useState<ActionGroup>("all");
  const [entityType, setEntityType] = useState("");
  const [actorRole, setActorRole] = useState("");

  const auditQuery = useQuery(
    trpc.business.admin.listAuditLogs.queryOptions({
      actionGroup,
      entityType: entityType.trim() || undefined,
      actorRole: actorRole.trim() || undefined,
      limit: 100,
      offset: 0,
    })
  );

  const logs = auditQuery.data?.items ?? [];

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Admin / Audit
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Журнал аудита
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Здесь отображаются действия из audit_logs: partner.*, offer.*,
          redemption.*, category.* и user.*.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={actionGroup}
            onChange={(event) => setActionGroup(event.target.value as ActionGroup)}
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-bold text-[#17384B] outline-none"
          >
            {actionGroups.map((group) => (
              <option key={group} value={group}>
                {actionGroupLabel(group)}
              </option>
            ))}
          </select>

          <input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="entityType: partner, offer, redemption..."
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />

          <input
            value={actorRole}
            onChange={(event) => setActorRole(event.target.value)}
            placeholder="actorRole: admin, owner..."
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none"
          />
        </div>

        <p className="mt-3 text-sm text-[#6B7280]">
          Найдено: {auditQuery.data?.total ?? 0}
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
        ) : logs.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Записей аудита нет.
          </div>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
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
                      <span className="font-bold text-[#17384B]">Partner:</span>{" "}
                      {log.partner?.brandName ?? log.partnerId ?? "—"}
                    </p>
                    <p>
                      <span className="font-bold text-[#17384B]">Entity ID:</span>{" "}
                      {log.entityId ?? "—"}
                    </p>
                    <p>
                      <span className="font-bold text-[#17384B]">Created:</span>{" "}
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <pre className="max-h-[220px] overflow-auto rounded-2xl bg-[#0F172A] p-4 text-xs text-white xl:w-[440px]">
                  {JSON.stringify(log.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
