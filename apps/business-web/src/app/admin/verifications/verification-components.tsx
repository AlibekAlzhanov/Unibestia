"use client";

import { type JSX } from "react";
import type {
  StatusFilter,
  VerificationAnalysis,
  VerificationItem,
  VerificationMetrics,
} from "./types";
import {
  checkClassName,
  degreeLabel,
  formatDate,
  recommendationLabel,
  statusClass,
  statusLabel,
} from "./verification-utils";

type MaybePromise<T> = T | Promise<T>;

export function VerificationHeader({
  isFetching,
  hasData,
}: {
  isFetching: boolean;
  hasData: boolean;
}): JSX.Element {
  return (
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

        {isFetching && hasData && (
          <span className="rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 py-2 text-xs font-black text-[#526470]">
            Обновляем список...
          </span>
        )}
      </div>
    </section>
  );
}

export function VerificationMetricsGrid({
  metrics,
  total,
  statusFilter,
  onChangeStatus,
}: {
  metrics: VerificationMetrics;
  total: number;
  statusFilter: StatusFilter;
  onChangeStatus: (status: StatusFilter) => void;
}): JSX.Element {
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-4">
      <button
        type="button"
        onClick={() => onChangeStatus("pending")}
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
        onClick={() => onChangeStatus("approved")}
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
        onClick={() => onChangeStatus("rejected")}
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
        onClick={() => onChangeStatus("all")}
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
  );
}

export function VerificationMessages({
  queryError,
  actionError,
  actionMessage,
}: {
  queryError?: { message?: string } | null;
  actionError: string | null;
  actionMessage: string | null;
}): JSX.Element {
  return (
    <>
      {queryError && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Не удалось загрузить заявки: {queryError.message ?? "Неизвестная ошибка"}
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
    </>
  );
}

function VerificationAnalysisPanel({
  analysis,
  isRejectActive,
  onInsertRejectReason,
}: {
  analysis: VerificationAnalysis;
  isRejectActive: boolean;
  onInsertRejectReason: (reason: string) => void;
}): JSX.Element {
  return (
    <div className="mt-5 rounded-[24px] border border-[#D8E3DE] bg-[#F9FAF8] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
            Template-aware AI/OCR Assistant
          </p>
          <h3 className="mt-1 text-xl font-black text-[#17384B]">
            {recommendationLabel(analysis.recommendation)}
          </h3>
          <p className="mt-2 text-sm text-[#6B7280]">{analysis.summary}</p>
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

      {isRejectActive && (
        <button
          type="button"
          onClick={() => onInsertRejectReason(analysis.suggestedRejectComment)}
          className="mt-4 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700"
        >
          Вставить AI причину отказа
        </button>
      )}
    </div>
  );
}

export function VerificationCard({
  item,
  analysis,
  isRejectActive,
  rejectReason,
  isActionLoading,
  isAnalysisLoading,
  onOpenDocument,
  onAnalyzeDocument,
  onApprove,
  onStartReject,
  onRejectReasonChange,
  onConfirmReject,
  onCancelReject,
  onInsertRejectReason,
}: {
  item: VerificationItem;
  analysis?: VerificationAnalysis;
  isRejectActive: boolean;
  rejectReason: string;
  isActionLoading: boolean;
  isAnalysisLoading: boolean;
  onOpenDocument: (item: VerificationItem) => MaybePromise<void>;
  onAnalyzeDocument: (item: VerificationItem) => MaybePromise<void>;
  onApprove: (verificationId: string) => MaybePromise<void>;
  onStartReject: (verificationId: string) => void;
  onRejectReasonChange: (value: string) => void;
  onConfirmReject: (verificationId: string) => MaybePromise<void>;
  onCancelReject: () => void;
  onInsertRejectReason: (reason: string) => void;
}): JSX.Element {
  return (
    <article className="rounded-[32px] border border-[#E5ECE9] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
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
            onClick={() => void onOpenDocument(item)}
            disabled={!item.documentUrl}
            className="rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B] disabled:opacity-50"
          >
            Открыть PDF
          </button>

          <button
            type="button"
            onClick={() => void onAnalyzeDocument(item)}
            disabled={!item.documentUrl || isAnalysisLoading}
            className="rounded-2xl border border-[#FFB5A4] bg-[#FFF7F4] px-5 py-3 text-sm font-bold text-[#FF7F6E] disabled:opacity-50"
          >
            {isAnalysisLoading ? "Анализ..." : "AI/OCR анализ"}
          </button>

          {item.status === "pending" && (
            <button
              type="button"
              onClick={() => void onApprove(item.id)}
              disabled={isActionLoading}
              className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Approve
            </button>
          )}

          {item.status === "pending" && (
            <button
              type="button"
              onClick={() => onStartReject(item.id)}
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
        <VerificationAnalysisPanel
          analysis={analysis}
          isRejectActive={isRejectActive}
          onInsertRejectReason={onInsertRejectReason}
        />
      )}

      {item.reviewComment && (
        <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm text-[#526470]">
          <span className="font-bold text-[#17384B]">Комментарий:</span>{" "}
          {item.reviewComment}
        </div>
      )}

      {isRejectActive && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <label>
            <span className="text-sm font-bold text-red-800">
              Причина отклонения
            </span>
            <textarea
              value={rejectReason}
              onChange={(event) => onRejectReasonChange(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-red-200 bg-white p-4 text-sm outline-none focus:border-red-400"
              placeholder="Например: PDF не читается, данные не совпадают..."
            />
          </label>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void onConfirmReject(item.id)}
              disabled={isActionLoading || rejectReason.trim().length < 2}
              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Подтвердить отклонение
            </button>
            <button
              type="button"
              onClick={onCancelReject}
              className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export function VerificationPagination({
  currentPage,
  totalPages,
  total,
  canGoPrev,
  canGoNext,
  isFetching,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFetching: boolean;
  onPrev: () => void;
  onNext: () => void;
}): JSX.Element {
  return (
    <section className="mt-6 flex flex-col items-center justify-between gap-3 rounded-[28px] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)] md:flex-row">
      <p className="text-sm font-bold text-[#526470]">
        Страница {currentPage} из {totalPages} · Всего заявок: {total}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev || isFetching}
          className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-bold text-[#17384B] disabled:opacity-50"
        >
          ← Назад
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isFetching}
          className="rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Далее →
        </button>
      </div>
    </section>
  );
}