"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { type JSX, useMemo, useState } from "react";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type VerificationStatus = "pending" | "approved" | "rejected" | "expired";
type StatusFilter = "all" | VerificationStatus;

type VerificationItem = {
  id: string;
  method: string;
  status: VerificationStatus;
  submittedEmail: string | null;
  documentType: string | null;
  documentUrl: string | null;
  reviewComment: string | null;
  reviewedAt: string | Date | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  student: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    status: string;
  } | null;
  studentProfile: {
    id: string;
    verificationStatus: string;
    studentEmail: string | null;
    degree: string | null;
    specialty: string | null;
    course: number | null;
    admissionDate: string | null;
    verifiedAt: string | Date | null;
    verificationExpiresAt: string | Date | null;
    university: {
      id: string;
      name: string;
      shortName: string | null;
      city: string | null;
      country: string;
      status: string;
    } | null;
  } | null;
  reviewedBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
};

type VerificationList = {
  total: number;
  metrics: {
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  };
  items: VerificationItem[];
};

type VerificationAnalysis = {
  recommendation: "approve" | "manual_review" | "reject";
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  pageCount: number | null;
  summary: string;
  suggestedApproveComment: string;
  suggestedRejectComment: string;
  extractedFields: {
    fullName: string | null;
    university: string | null;
    degree: string | null;
    programGroup: string | null;
    course: string | null;
    admissionDate: string | null;
    hasStudentCardTitle: boolean;
    rawTextPreview: string;
  };
  checks: Array<{
    code: string;
    label: string;
    status: "pass" | "warning" | "fail";
    message: string;
  }>;
};

const PAGE_SIZE = 20;

function getBackendApiUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_TRPC_URL ??
    "http://localhost:3001";

  const trimmedUrl = rawUrl.trim();

  if (
    !trimmedUrl ||
    trimmedUrl === "/" ||
    trimmedUrl === "/trpc" ||
    trimmedUrl === "/trpc/"
  ) {
    return "http://localhost:3001";
  }

  const normalizedUrl = trimmedUrl
    .replace(/\/trpc\/?$/, "")
    .replace(/\/+$/, "");

  if (!normalizedUrl || normalizedUrl === "/") {
    return "http://localhost:3001";
  }

  return normalizedUrl;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "На проверке",
    approved: "Подтверждено",
    rejected: "Отклонено",
    expired: "Истекло",
  };

  return labels[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "expired") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function degreeLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    bachelor: "Бакалавриат",
    master: "Магистратура",
    phd: "Докторантура / PhD",
    other: "Другое",
  };

  return value ? labels[value] ?? value : "—";
}

function checkClassName(status: "pass" | "warning" | "fail"): string {
  if (status === "pass") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "warning") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function recommendationLabel(value: string): string {
  const labels: Record<string, string> = {
    approve: "Рекомендуется approve",
    manual_review: "Нужна ручная проверка",
    reject: "Рекомендуется reject",
  };

  return labels[value] ?? value;
}

export default function AdminStudentVerificationsPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { getToken } = useAuth();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [pageIndex, setPageIndex] = useState(0);
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [analysisLoadingId, setAnalysisLoadingId] = useState<string | null>(
    null
  );
  const [analysisById, setAnalysisById] = useState<
    Record<string, VerificationAnalysis>
  >({});

  const listQuery = useQuery({
    ...trpc.adminStudentVerifications.list.queryOptions({
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
    }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const verificationList = listQuery.data as VerificationList | undefined;
  const items = useMemo(
    () => verificationList?.items ?? [],
    [verificationList?.items]
  );

  const metrics = verificationList?.metrics ?? {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  };

  const total = verificationList?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const currentPage = pageIndex + 1;
  const canGoPrev = pageIndex > 0;
  const canGoNext = currentPage < totalPages;

  function changeStatusFilter(nextStatus: StatusFilter): void {
    setStatusFilter(nextStatus);
    setPageIndex(0);
    setActiveRejectId(null);
    setRejectReason("");
    setActionError(null);
    setActionMessage(null);
  }

  async function approveVerification(verificationId: string): Promise<void> {
    setIsActionLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await trpcClient.adminStudentVerifications.approve.mutate({
        verificationId,
        expiresInDays: 365,
      });

      setActionMessage("Студент подтверждён.");
      await listQuery.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Не удалось подтвердить студента"
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function rejectVerification(verificationId: string): Promise<void> {
    setIsActionLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await trpcClient.adminStudentVerifications.reject.mutate({
        verificationId,
        reviewComment: rejectReason.trim(),
      });

      setActionMessage("Заявка отклонена.");
      setActiveRejectId(null);
      setRejectReason("");
      await listQuery.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось отклонить заявку"
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function openDocument(item: VerificationItem): Promise<void> {
    if (!item.documentUrl) {
      setActionError("У этой заявки нет PDF документа.");
      return;
    }

    setActionError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(`${getBackendApiUrl()}${item.documentUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось открыть PDF документ");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось открыть PDF"
      );
    }
  }

  async function analyzeDocument(item: VerificationItem): Promise<void> {
    if (!item.documentUrl) {
      setActionError("У этой заявки нет PDF документа.");
      return;
    }

    setAnalysisLoadingId(item.id);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        `${getBackendApiUrl()}/student-verifications/documents/${item.id}/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Не удалось выполнить AI/OCR анализ");
      }

      const result = (await response.json()) as VerificationAnalysis;

      setAnalysisById((current) => ({
        ...current,
        [item.id]: result,
      }));

      setActionMessage("AI/OCR анализ выполнен.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось выполнить анализ"
      );
    } finally {
      setAnalysisLoadingId(null);
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1280px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
              Admin Verification
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#17384B]">
              Проверка студентов
            </h1>
            <p className="mt-3 max-w-3xl text-[#6B7280]">
              Проверяйте PDF электронного студенческого, подтверждайте или
              отклоняйте заявки. После approve студент получает verified-статус
              на 1 год.
            </p>
          </div>

          {listQuery.isFetching && verificationList && (
            <span className="rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 py-2 text-xs font-black text-[#526470]">
              Обновляем список...
            </span>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => changeStatusFilter("pending")}
          className={`rounded-[24px] border p-5 text-left ${
            statusFilter === "pending"
              ? "border-[#FF9F8A] bg-[#FFF7F4]"
              : "border-[#E5ECE9] bg-white"
          }`}
        >
          <p className="text-sm font-bold text-[#6B7280]">На проверке</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.pending}
          </p>
        </button>

        <button
          type="button"
          onClick={() => changeStatusFilter("approved")}
          className={`rounded-[24px] border p-5 text-left ${
            statusFilter === "approved"
              ? "border-green-300 bg-green-50"
              : "border-[#E5ECE9] bg-white"
          }`}
        >
          <p className="text-sm font-bold text-[#6B7280]">Подтверждено</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.approved}
          </p>
        </button>

        <button
          type="button"
          onClick={() => changeStatusFilter("rejected")}
          className={`rounded-[24px] border p-5 text-left ${
            statusFilter === "rejected"
              ? "border-red-300 bg-red-50"
              : "border-[#E5ECE9] bg-white"
          }`}
        >
          <p className="text-sm font-bold text-[#6B7280]">Отклонено</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">
            {metrics.rejected}
          </p>
        </button>

        <button
          type="button"
          onClick={() => changeStatusFilter("all")}
          className={`rounded-[24px] border p-5 text-left ${
            statusFilter === "all"
              ? "border-[#17384B] bg-[#F6F8F7]"
              : "border-[#E5ECE9] bg-white"
          }`}
        >
          <p className="text-sm font-bold text-[#6B7280]">Все заявки</p>
          <p className="mt-2 text-3xl font-black text-[#17384B]">{total}</p>
        </button>
      </section>

      {listQuery.error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить заявки: {listQuery.error.message}
        </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 text-green-700">
          {actionMessage}
        </div>
      )}

      <section className="mt-6 grid gap-4">
        {listQuery.isLoading && !verificationList ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Загружаем заявки...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-[#6B7280]">
            Заявок по выбранному фильтру нет.
          </div>
        ) : (
          items.map((item) => {
            const analysis = analysisById[item.id];

            return (
              <article
                key={item.id}
                className="rounded-[32px] border border-[#E5ECE9] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-2xl border px-3 py-1 text-xs font-black ${statusClass(
                          item.status
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                      <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
                        {item.method}
                      </span>
                      {item.documentType && (
                        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-bold text-[#526470]">
                          {item.documentType}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-[#17384B]">
                      {item.student?.displayName ||
                        `${item.student?.firstName ?? ""} ${
                          item.student?.lastName ?? ""
                        }`.trim() ||
                        item.student?.email ||
                        "Студент"}
                    </h2>

                    <p className="mt-2 break-all text-sm text-[#6B7280]">
                      {item.student?.email ?? item.submittedEmail ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Создано: {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:items-start">
                    <button
                      type="button"
                      onClick={() => openDocument(item)}
                      disabled={!item.documentUrl}
                      className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B] disabled:opacity-50"
                    >
                      Открыть PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => analyzeDocument(item)}
                      disabled={
                        !item.documentUrl || analysisLoadingId === item.id
                      }
                      className="rounded-2xl border border-[#FFB5A4] bg-[#FFF7F4] px-5 py-3 text-sm font-bold text-[#FF7F6E] disabled:opacity-50"
                    >
                      {analysisLoadingId === item.id
                        ? "Анализ..."
                        : "AI/OCR анализ"}
                    </button>

                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => approveVerification(item.id)}
                        disabled={isActionLoading}
                        className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}

                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRejectId(item.id);
                          setRejectReason("");
                        }}
                        disabled={isActionLoading}
                        className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-[#F9FAF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Университет
                    </p>
                    <p className="mt-1 font-bold text-[#17384B]">
                      {item.studentProfile?.university?.shortName ||
                        item.studentProfile?.university?.name ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F9FAF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Степень
                    </p>
                    <p className="mt-1 font-bold text-[#17384B]">
                      {degreeLabel(item.studentProfile?.degree)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F9FAF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Специальность
                    </p>
                    <p className="mt-1 font-bold text-[#17384B]">
                      {item.studentProfile?.specialty ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F9FAF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Курс / Поступление
                    </p>
                    <p className="mt-1 font-bold text-[#17384B]">
                      {item.studentProfile?.course ?? "—"} курс
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {item.studentProfile?.admissionDate ?? "—"}
                    </p>
                  </div>
                </div>

                {analysis && (
                  <div className="mt-5 rounded-[24px] border border-[#D8E3DE] bg-[#F9FAF8] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                          Template-aware AI/OCR Assistant
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#17384B]">
                          {recommendationLabel(analysis.recommendation)}
                        </h3>
                        <p className="mt-2 text-sm text-[#6B7280]">
                          {analysis.summary}
                        </p>
                      </div>

                      <div className="grid gap-2 text-right">
                        <span className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#17384B]">
                          Confidence: {analysis.confidence}%
                        </span>
                        <span className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#17384B]">
                          Risk: {analysis.riskLevel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                          ФИО из PDF
                        </p>
                        <p className="mt-1 font-bold text-[#17384B]">
                          {analysis.extractedFields.fullName ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                          Университет из PDF
                        </p>
                        <p className="mt-1 font-bold text-[#17384B]">
                          {analysis.extractedFields.university ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                          Степень
                        </p>
                        <p className="mt-1 font-bold text-[#17384B]">
                          {analysis.extractedFields.degree ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                          Группа программ
                        </p>
                        <p className="mt-1 font-bold text-[#17384B]">
                          {analysis.extractedFields.programGroup ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                          Курс
                        </p>
                        <p className="mt-1 font-bold text-[#17384B]">
                          {analysis.extractedFields.course ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                          Дата поступления
                        </p>
                        <p className="mt-1 font-bold text-[#17384B]">
                          {analysis.extractedFields.admissionDate ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2">
                      {analysis.checks.map((check) => (
                        <div
                          key={check.code}
                          className={`rounded-2xl border p-3 text-sm ${checkClassName(
                            check.status
                          )}`}
                        >
                          <p className="font-black">{check.label}</p>
                          <p className="mt-1">{check.message}</p>
                        </div>
                      ))}
                    </div>

                    {activeRejectId === item.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setRejectReason(analysis.suggestedRejectComment)
                        }
                        className="mt-4 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700"
                      >
                        Вставить AI причину отказа
                      </button>
                    )}
                  </div>
                )}

                {item.reviewComment && (
                  <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm text-[#526470]">
                    <span className="font-bold text-[#17384B]">
                      Комментарий:
                    </span>{" "}
                    {item.reviewComment}
                  </div>
                )}

                {activeRejectId === item.id && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <label>
                      <span className="text-sm font-bold text-red-800">
                        Причина отклонения
                      </span>
                      <textarea
                        value={rejectReason}
                        onChange={(event) =>
                          setRejectReason(event.target.value)
                        }
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-red-200 bg-white p-4 text-sm outline-none focus:border-red-400"
                        placeholder="Например: PDF не читается, данные не совпадают..."
                      />
                    </label>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => rejectVerification(item.id)}
                        disabled={
                          isActionLoading || rejectReason.trim().length < 2
                        }
                        className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Подтвердить отклонение
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRejectId(null);
                          setRejectReason("");
                        }}
                        className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      <section className="mt-6 flex flex-col items-center justify-between gap-3 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)] md:flex-row">
        <p className="text-sm font-bold text-[#526470]">
          Страница {currentPage} из {totalPages} · Всего заявок: {total}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
            disabled={!canGoPrev || listQuery.isFetching}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-bold text-[#17384B] disabled:opacity-50"
          >
            ← Назад
          </button>
          <button
            type="button"
            onClick={() =>
              setPageIndex((current) =>
                current + 1 < totalPages ? current + 1 : current
              )
            }
            disabled={!canGoNext || listQuery.isFetching}
            className="rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Далее →
          </button>
        </div>
      </section>
    </div>
  );
}