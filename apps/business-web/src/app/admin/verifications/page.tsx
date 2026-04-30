"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { type JSX, useMemo, useState } from "react";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import {
  VerificationCard,
  VerificationHeader,
  VerificationMessages,
  VerificationMetricsGrid,
  VerificationPagination,
} from "./verification-components";
import type {
  StatusFilter,
  VerificationAnalysis,
  VerificationItem,
  VerificationList,
} from "./types";
import { getBackendApiUrl } from "./verification-utils";

const PAGE_SIZE = 20;

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
      <VerificationHeader
        isFetching={listQuery.isFetching}
        hasData={Boolean(verificationList)}
      />

      <VerificationMetricsGrid
        metrics={metrics}
        total={total}
        statusFilter={statusFilter}
        onChangeStatus={changeStatusFilter}
      />

      <VerificationMessages
        queryError={listQuery.error}
        actionError={actionError}
        actionMessage={actionMessage}
      />

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
          items.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              analysis={analysisById[item.id]}
              isRejectActive={activeRejectId === item.id}
              rejectReason={rejectReason}
              isActionLoading={isActionLoading}
              isAnalysisLoading={analysisLoadingId === item.id}
              onOpenDocument={openDocument}
              onAnalyzeDocument={analyzeDocument}
              onApprove={approveVerification}
              onStartReject={(verificationId) => {
                setActiveRejectId(verificationId);
                setRejectReason("");
              }}
              onRejectReasonChange={setRejectReason}
              onConfirmReject={rejectVerification}
              onCancelReject={() => {
                setActiveRejectId(null);
                setRejectReason("");
              }}
              onInsertRejectReason={setRejectReason}
            />
          ))
        )}
      </section>

      <VerificationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isFetching={listQuery.isFetching}
        onPrev={() => setPageIndex((current) => Math.max(current - 1, 0))}
        onNext={() =>
          setPageIndex((current) =>
            current + 1 < totalPages ? current + 1 : current
          )
        }
      />
    </div>
  );
}