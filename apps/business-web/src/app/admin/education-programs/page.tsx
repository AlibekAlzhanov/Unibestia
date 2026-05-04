"use client";

import { type FormEvent, type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

type DegreeValue = "bachelor" | "master" | "phd" | "other";
type DegreeFilter = DegreeValue | "all";

type ProgramItem = {
  id: string;
  code: string;
  nameRu: string;
  nameKz: string;
  nameEn: string | null;
  degree: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ProgramForm = {
  id: string | null;
  code: string;
  nameRu: string;
  nameKz: string;
  nameEn: string;
  degree: DegreeValue;
  isActive: boolean;
};

const initialForm: ProgramForm = {
  id: null,
  code: "",
  nameRu: "",
  nameKz: "",
  nameEn: "",
  degree: "bachelor",
  isActive: true,
};

const degreeOptions: Array<{ value: DegreeValue; label: string }> = [
  { value: "bachelor", label: "Бакалавр" },
  { value: "master", label: "Магистр" },
  { value: "phd", label: "PhD / Докторантура" },
  { value: "other", label: "Другое" },
];

const degreeLabels: Record<string, string> = {
  bachelor: "Бакалавр",
  master: "Магистр",
  phd: "PhD / Докторантура",
  other: "Другое",
};

function boolLabel(value: boolean): string {
  return value ? "Активна" : "Выключена";
}

function statusClass(value: boolean): string {
  return value
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function normalizeProgramCode(value: string): string {
  return value.trim().toUpperCase();
}

function LoadingPrograms(): JSX.Element {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="ub-card rounded-[30px] p-6">
          <div className="ub-skeleton h-7 w-28 rounded-full" />
          <div className="ub-skeleton mt-5 h-6 w-2/3 rounded-full" />
          <div className="ub-skeleton mt-4 h-4 w-full rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-4/5 rounded-full" />
          <div className="ub-skeleton mt-5 h-12 rounded-2xl" />
        </article>
      ))}
    </section>
  );
}

function EmptyPrograms({ onReset }: { onReset: () => void }): JSX.Element {
  return (
    <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FFF0EB] text-2xl font-black text-[#FF7F6E]">
        B
      </div>

      <h2 className="mt-5 text-2xl font-black text-[#17384B]">
        Образовательных программ пока нет
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#6B7280]">
        Создай общий справочник групп образовательных программ. Например: B057 —
        Информационные технологии. После этого студент сможет выбрать программу
        в профиле.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="ub-gradient-button mt-6 rounded-2xl px-5 py-3 text-sm font-black text-white"
      >
        Сбросить фильтры
      </button>
    </section>
  );
}

function ProgramCard({
  program,
  isBusy,
  onEdit,
  onToggle,
}: {
  program: ProgramItem;
  isBusy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}): JSX.Element {
  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={[
            "rounded-2xl border px-3 py-1 text-xs font-black",
            statusClass(program.isActive),
          ].join(" ")}
        >
          {boolLabel(program.isActive)}
        </span>

        <span className="rounded-2xl bg-[#F7F6F1] px-3 py-1 text-xs font-black text-[#526470]">
          {degreeLabels[program.degree] ?? program.degree}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="rounded-2xl bg-[#17384B] px-4 py-2 text-lg font-black text-white">
          {program.code}
        </span>

        <h2 className="text-xl font-black leading-tight text-[#17384B]">
          {program.nameRu}
        </h2>
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Қазақша
          </p>
          <p className="mt-1 font-bold text-[#17384B]">{program.nameKz}</p>
        </div>

        {program.nameEn && (
          <div className="rounded-2xl bg-[#F9FAF8] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
              English
            </p>
            <p className="mt-1 font-bold text-[#17384B]">{program.nameEn}</p>
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
        >
          Редактировать
        </button>

        <button
          type="button"
          onClick={onToggle}
          disabled={isBusy}
          className={[
            "rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
            program.isActive
              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "bg-[#17384B] text-white shadow-[0_12px_24px_rgba(23,56,75,0.16)] hover:bg-[#255B73]",
          ].join(" ")}
        >
          {isBusy
            ? "Обновляем..."
            : program.isActive
              ? "Выключить"
              : "Включить"}
        </button>
      </div>
    </article>
  );
}

export default function AdminEducationProgramsPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [form, setForm] = useState<ProgramForm>(initialForm);
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<DegreeFilter>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [busyProgramId, setBusyProgramId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const programsQuery = useQuery(
    trpc.educationPrograms.adminList.queryOptions({
      search: search.trim() || undefined,
      degree: degreeFilter === "all" ? undefined : (degreeFilter as never),
      isActive: activeOnly ? true : undefined,
      limit: 100,
      offset: 0,
    })
  );

  const programs = useMemo(
    () => (programsQuery.data?.items ?? []) as ProgramItem[],
    [programsQuery.data?.items]
  );

  const totalPrograms = programsQuery.data?.total ?? programs.length;
  const activeCount = programs.filter((program) => program.isActive).length;
  const inactiveCount = programs.filter((program) => !program.isActive).length;

  function updateForm<K extends keyof ProgramForm>(
    key: K,
    value: ProgramForm[K]
  ): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm(): void {
    setForm(initialForm);
    setError(null);
    setMessage(null);
  }

  function editProgram(program: ProgramItem): void {
    setForm({
      id: program.id,
      code: program.code,
      nameRu: program.nameRu,
      nameKz: program.nameKz,
      nameEn: program.nameEn ?? "",
      degree: (program.degree as DegreeValue) || "bachelor",
      isActive: program.isActive,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProgram(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      code: normalizeProgramCode(form.code),
      nameRu: form.nameRu.trim(),
      nameKz: form.nameKz.trim(),
      nameEn: form.nameEn.trim() || null,
      degree: form.degree as never,
      isActive: form.isActive,
    };

    try {
      if (form.id) {
        await trpcClient.educationPrograms.adminUpdate.mutate({
          id: form.id,
          ...payload,
        });
        setMessage("Образовательная программа обновлена.");
      } else {
        await trpcClient.educationPrograms.adminCreate.mutate(payload);
        setMessage("Образовательная программа создана.");
      }

      resetForm();
      await programsQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось сохранить образовательную программу"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleProgram(program: ProgramItem): Promise<void> {
    setBusyProgramId(program.id);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.educationPrograms.adminUpdate.mutate({
        id: program.id,
        isActive: !program.isActive,
      });

      setMessage("Статус образовательной программы обновлён.");
      await programsQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить статус образовательной программы"
      );
    } finally {
      setBusyProgramId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Admin / Education Programs
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Группы образовательных программ
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Управляйте единым справочником образовательных программ Казахстана:
              B057, B058, B059 и другие группы. Студент выбирает программу из
              этого списка, а PDF-проверка сравнивает код и название с документом.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{totalPrograms}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Всего
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Active
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{inactiveCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Inactive
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={saveProgram}
        className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              {form.id ? "Редактирование" : "Новая программа"}
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              {form.id
                ? "Редактировать группу образовательных программ"
                : "Создать группу образовательных программ"}
            </h2>
          </div>

          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
            >
              Отменить редактирование
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[160px_1fr_1fr]">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Код
            </span>

            <input
              value={form.code}
              onChange={(event) => updateForm("code", event.target.value)}
              required
              minLength={1}
              maxLength={20}
              placeholder="B057"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Название RU
            </span>

            <input
              value={form.nameRu}
              onChange={(event) => updateForm("nameRu", event.target.value)}
              required
              minLength={2}
              maxLength={255}
              placeholder="Информационные технологии"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Название KZ
            </span>

            <input
              value={form.nameKz}
              onChange={(event) => updateForm("nameKz", event.target.value)}
              required
              minLength={2}
              maxLength={255}
              placeholder="Ақпараттық технологиялар"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px_180px]">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Название EN
            </span>

            <input
              value={form.nameEn}
              onChange={(event) => updateForm("nameEn", event.target.value)}
              maxLength={255}
              placeholder="Information Technologies"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Степень
            </span>

            <select
              value={form.degree}
              onChange={(event) =>
                updateForm("degree", event.target.value as DegreeValue)
              }
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            >
              {degreeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end gap-3 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#526470]">
            <input
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
              type="checkbox"
              className="h-4 w-4"
            />
            Активна
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#6B7280]">
            Пример для твоего документа: <b>B057</b> — Информационные технологии /
            Ақпараттық технологиялар.
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Сохраняем..."
              : form.id
                ? "Сохранить изменения"
                : "Создать программу"}
          </button>
        </div>
      </form>

      <section className="rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_180px] md:items-end">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Поиск
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="B057, технологии, ақпараттық..."
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Степень
            </span>

            <select
              value={degreeFilter}
              onChange={(event) =>
                setDegreeFilter(event.target.value as DegreeFilter)
              }
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            >
              <option value="all">Все</option>
              {degreeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#526470]">
            <input
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
              type="checkbox"
              className="h-4 w-4"
            />
            Только активные
          </label>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {programsQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить образовательные программы: {programsQuery.error.message}
        </div>
      )}

      {programsQuery.isLoading ? (
        <LoadingPrograms />
      ) : programs.length === 0 ? (
        <EmptyPrograms
          onReset={() => {
            setSearch("");
            setDegreeFilter("all");
            setActiveOnly(false);
          }}
        />
      ) : (
        <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program, index) => {
            const isBusy = busyProgramId === program.id;

            return (
              <div
                key={program.id}
                className={[
                  "ub-animate-fade-up",
                  index === 1 ? "ub-delay-100" : "",
                  index === 2 ? "ub-delay-200" : "",
                ].join(" ")}
              >
                <ProgramCard
                  program={program}
                  isBusy={isBusy}
                  onEdit={() => editProgram(program)}
                  onToggle={() => {
                    void toggleProgram(program);
                  }}
                />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
