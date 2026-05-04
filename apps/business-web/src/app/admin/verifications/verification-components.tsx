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

function recommendationClass(value: VerificationAnalysis["recommendation"]): string {
  if (value === "approve") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (value === "reject") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function riskClass(value: VerificationAnalysis["riskLevel"]): string {
  if (value === "low") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (value === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

function getStudentName(item: VerificationItem): string {
  return (
    item.student?.displayName ||
    `${item.student?.firstName ?? ""} ${item.student?.lastName ?? ""}`.trim() ||
    item.student?.email ||
    item.submittedEmail ||
    "Студент"
  );
}

function getUniversityName(item: VerificationItem): string {
  return (
    item.studentProfile?.university?.shortName ||
    item.studentProfile?.university?.name ||
    "—"
  );
}

function isPending(item: VerificationItem): boolean {
  return item.status === "pending";
}

export function VerificationHeader({
  isFetching,
  hasData,
}: {
  isFetching: boolean;
  hasData: boolean;
}): JSX.Element {
  return (
    <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
      <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
            Admin Verification
          </p>

          <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
            Проверка студентов
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
            Проверяйте PDF электронного студенческого, запускайте AI/OCR-анализ,
            подтверждайте или отклоняйте заявки. После approve студент получает
            verified-статус на 1 год.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFB5A4]">
            Status
          </p>

          <p className="mt-2 text-2xl font-black">
            {isFetching && hasData ? "Обновляем" : "Готово"}
          </p>

          <p className="mt-2 text-sm leading-6 text-[#DDE8EA]">
            Используйте PDF и AI/OCR как помощника, финальное решение принимает
            администратор.
          </p>
        </div>
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
  const cards: Array<{
    value: StatusFilter;
    label: string;
    count: number;
    hint: string;
  }> = [
    {
      value: "pending",
      label: "На проверке",
      count: metrics.pending,
      hint: "Ожидают решения администратора",
    },
    {
      value: "approved",
      label: "Подтверждено",
      count: metrics.approved,
      hint: "Студенты получили verified-статус",
    },
    {
      value: "rejected",
      label: "Отклонено",
      count: metrics.rejected,
      hint: "Заявки с причиной отказа",
    },
    {
      value: "all",
      label: "Все заявки",
      count: total,
      hint: "Полный список проверок",
    },
  ];

  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const isActive = statusFilter === card.value;

        return (
          <button
            key={card.value}
            type="button"
            onClick={() => onChangeStatus(card.value)}
            className={[
              "ub-card ub-animate-fade-up rounded-[28px] p-5 text-left",
              index === 1 ? "ub-delay-100" : "",
              index === 2 ? "ub-delay-200" : "",
              isActive
                ? "border-[#FFB5A4] bg-[#FFF7F4]"
                : "border-[#E5ECE9] bg-white",
            ].join(" ")}
          >
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9CA3AF]">
              {card.label}
            </p>

            <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#17384B]">
              {card.count}
            </p>

            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              {card.hint}
            </p>
          </button>
        );
      })}
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
        <div className="mt-6 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Не удалось загрузить заявки:{" "}
          {queryError.message ?? "Неизвестная ошибка"}
        </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div className="mt-6 rounded-[28px] border border-green-200 bg-green-50 p-5 text-sm font-bold text-green-700">
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
    <div className="mt-6 rounded-[28px] border border-[#D8E3DE] bg-[#F9FAF8] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
            Reference-aware PDF Assistant
          </p>

          <h3 className="mt-2 text-2xl font-black text-[#17384B]">
            {recommendationLabel(analysis.recommendation)}
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7280]">
            {analysis.summary}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[260px] lg:grid-cols-1">
          <span
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-black",
              recommendationClass(analysis.recommendation),
            ].join(" ")}
          >
            Recommendation: {analysis.recommendation}
          </span>

          <span className="rounded-2xl border border-[#E5ECE9] bg-white px-4 py-3 text-sm font-black text-[#17384B]">
            Confidence: {analysis.confidence}%
          </span>

          <span
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-black",
              riskClass(analysis.riskLevel),
            ].join(" ")}
          >
            Risk: {analysis.riskLevel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["ФИО из PDF", analysis.extractedFields.fullName],
          ["Университет из PDF", analysis.extractedFields.university],
          ["Степень", analysis.extractedFields.degree],
          ["Группа образовательных программ", analysis.extractedFields.programGroup],
          ["Курс", analysis.extractedFields.course],
          ["Дата поступления", analysis.extractedFields.admissionDate],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#94A3B8]">
              {label}
            </p>

            <p className="mt-1 font-bold text-[#17384B]">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        {analysis.checks.map((check) => (
          <div
            key={check.code}
            className={[
              "rounded-2xl border p-4 text-sm",
              checkClassName(check.status),
            ].join(" ")}
          >
            <p className="font-black">{check.label}</p>
            <p className="mt-1 leading-6">{check.message}</p>
          </div>
        ))}
      </div>

      {analysis.extractedFields.rawTextPreview && (
        <details className="mt-5 rounded-2xl border border-[#E5ECE9] bg-white p-4">
          <summary className="cursor-pointer text-sm font-black text-[#17384B]">
            Показать OCR preview
          </summary>

          <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#6B7280]">
            {analysis.extractedFields.rawTextPreview}
          </p>
        </details>
      )}

      {isRejectActive && (
        <button
          type="button"
          onClick={() => onInsertRejectReason(analysis.suggestedRejectComment)}
          className="mt-5 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
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
    <article className="ub-card ub-animate-fade-up rounded-[32px] p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-2xl border px-3 py-1 text-xs font-black",
                statusClass(item.status),
              ].join(" ")}
            >
              {statusLabel(item.status)}
            </span>

            <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
              {item.method}
            </span>

            {item.documentType && (
              <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
                {item.documentType}
              </span>
            )}

            <span className="rounded-2xl bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
              ID: {item.id.slice(0, 8)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-[#17384B]">
            {getStudentName(item)}
          </h2>

          <p className="mt-2 break-all text-sm font-bold text-[#526470]">
            {item.student?.email ?? item.submittedEmail ?? "—"}
          </p>

          <p className="mt-1 text-sm text-[#6B7280]">
            Создано: {formatDate(item.createdAt)}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
          <button
            type="button"
            onClick={() => void onOpenDocument(item)}
            disabled={!item.documentUrl}
            className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Открыть PDF
          </button>

          <button
            type="button"
            onClick={() => void onAnalyzeDocument(item)}
            disabled={!item.documentUrl || isAnalysisLoading}
            className="rounded-2xl border border-[#FFB5A4] bg-[#FFF7F4] px-5 py-3 text-sm font-black text-[#FF7F6E] transition hover:bg-[#FFE4DC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalysisLoading ? "Анализ..." : "AI/OCR анализ"}
          </button>

          {isPending(item) && (
            <button
              type="button"
              onClick={() => void onApprove(item.id)}
              disabled={isActionLoading}
              className="rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Подтвердить
            </button>
          )}

          {isPending(item) && (
            <button
              type="button"
              onClick={() => onStartReject(item.id)}
              disabled={isActionLoading}
              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.16)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отклонить
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#94A3B8]">
            Университет
          </p>

          <p className="mt-1 font-bold text-[#17384B]">
            {getUniversityName(item)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#94A3B8]">
            Степень
          </p>

          <p className="mt-1 font-bold text-[#17384B]">
            {degreeLabel(item.studentProfile?.degree)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#94A3B8]">
            Группа образовательных программ
          </p>

          <p className="mt-1 font-bold text-[#17384B]">
            {item.studentProfile?.specialty ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#94A3B8]">
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
        <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm leading-6 text-[#526470]">
          <span className="font-black text-[#17384B]">Комментарий:</span>{" "}
          {item.reviewComment}
        </div>
      )}

      {isRejectActive && (
        <div className="mt-5 rounded-[28px] border border-red-200 bg-red-50 p-5">
          <label>
            <span className="text-sm font-black text-red-800">
              Причина отклонения
            </span>

            <textarea
              value={rejectReason}
              onChange={(event) => onRejectReasonChange(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-red-200 bg-white p-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
              placeholder="Например: PDF не читается, данные не совпадают..."
            />
          </label>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void onConfirmReject(item.id)}
              disabled={isActionLoading || rejectReason.trim().length < 2}
              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Подтвердить отклонение
            </button>

            <button
              type="button"
              onClick={onCancelReject}
              className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
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
    <section className="mt-6 flex flex-col items-center justify-between gap-3 rounded-[28px] border border-[#E5ECE9] bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)] md:flex-row">
      <p className="text-sm font-bold text-[#526470]">
        Страница {currentPage} из {totalPages} · Всего заявок: {total}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev || isFetching}
          className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Назад
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isFetching}
          className="rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Далее →
        </button>
      </div>
    </section>
  );
}