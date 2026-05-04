"use client";

import { type FormEvent, type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import type { RouterInputs } from "@repo/trpc";

type UniversityStatus = NonNullable<
  RouterInputs["universities"]["adminCreate"]["status"]
>;

const UNIVERSITY_STATUS_ACTIVE = "active" as UniversityStatus;
const UNIVERSITY_STATUS_INACTIVE = "inactive" as UniversityStatus;

type UniversityEmailDomainItem = {
  id: string;
  domain: string;
  isActive: boolean;
  createdAt: Date | string;
};

type UniversityItem = {
  id: string;
  name: string;
  shortName: string | null;
  officialNameRu: string | null;
  officialNameKz: string | null;
  officialNameEn: string | null;
  documentKeywords: string[];
  city: string | null;
  country: string;
  status: UniversityStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  emailDomains: UniversityEmailDomainItem[];
};

type UniversityFormState = {
  id?: string;
  name: string;
  shortName: string;
  officialNameRu: string;
  officialNameKz: string;
  officialNameEn: string;
  documentKeywordsText: string;
  city: string;
  country: string;
  status: UniversityStatus;
};

const emptyForm: UniversityFormState = {
  name: "",
  shortName: "",
  officialNameRu: "",
  officialNameKz: "",
  officialNameEn: "",
  documentKeywordsText: "",
  city: "Алматы",
  country: "Kazakhstan",
  status: UNIVERSITY_STATUS_ACTIVE,
};

function statusLabel(status: UniversityStatus): string {
  return status === UNIVERSITY_STATUS_ACTIVE ? "Активен" : "Выключен";
}

function statusClass(status: UniversityStatus): string {
  return status === UNIVERSITY_STATUS_ACTIVE
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function splitKeywords(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function keywordsToText(value: string[]): string {
  return value.join("\n");
}

function toNullable(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toForm(university: UniversityItem): UniversityFormState {
  return {
    id: university.id,
    name: university.name,
    shortName: university.shortName ?? "",
    officialNameRu: university.officialNameRu ?? "",
    officialNameKz: university.officialNameKz ?? "",
    officialNameEn: university.officialNameEn ?? "",
    documentKeywordsText: keywordsToText(university.documentKeywords ?? []),
    city: university.city ?? "",
    country: university.country ?? "Kazakhstan",
    status: university.status,
  };
}

function LoadingCards(): JSX.Element {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
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

function UniversityCard({
  university,
  isBusy,
  onEdit,
  onToggleStatus,
  onAddDomain,
  onToggleDomain,
}: {
  university: UniversityItem;
  isBusy: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onAddDomain: (domain: string) => Promise<void>;
  onToggleDomain: (domainId: string, isActive: boolean) => Promise<void>;
}): JSX.Element {
  const [domainValue, setDomainValue] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  async function submitDomain(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const domain = domainValue.trim();

    if (!domain) {
      return;
    }

    setIsAddingDomain(true);

    try {
      await onAddDomain(domain);
      setDomainValue("");
    } finally {
      setIsAddingDomain(false);
    }
  }

  return (
    <article className="ub-card flex h-full flex-col rounded-[30px] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className={[
              "inline-flex rounded-2xl border px-3 py-1 text-xs font-black",
              statusClass(university.status),
            ].join(" ")}
          >
            {statusLabel(university.status)}
          </span>

          <h2 className="mt-4 text-2xl font-black leading-tight text-[#17384B]">
            {university.name}
          </h2>

          <p className="mt-2 text-sm font-semibold text-[#6B7280]">
            {university.shortName || "Без короткого названия"} ·{" "}
            {university.city || "Город не указан"}
          </p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-2xl border border-[#D8E3DE] bg-white px-4 py-2 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
        >
          Редактировать
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Official RU
          </p>
          <p className="mt-2 text-sm leading-6 text-[#17384B]">
            {university.officialNameRu || "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Official KZ
          </p>
          <p className="mt-2 text-sm leading-6 text-[#17384B]">
            {university.officialNameKz || "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F9FAF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
            Keywords
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {university.documentKeywords.length === 0 ? (
              <span className="text-sm text-[#6B7280]">—</span>
            ) : (
              university.documentKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[#E5ECE9] bg-white px-3 py-1 text-xs font-black text-[#526470]"
                >
                  {keyword}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-[#E5ECE9] bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9CA3AF]">
              Email domains
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Домены для проверки корпоративной почты.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {university.emailDomains.length === 0 ? (
            <p className="rounded-2xl bg-[#F9FAF8] p-3 text-sm text-[#6B7280]">
              Домены ещё не добавлены.
            </p>
          ) : (
            university.emailDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex flex-col gap-2 rounded-2xl bg-[#F9FAF8] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-mono text-sm font-bold text-[#17384B]">
                  @{domain.domain}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    void onToggleDomain(domain.id, domain.isActive);
                  }}
                  className={[
                    "w-fit rounded-xl border px-3 py-1 text-xs font-black transition",
                    domain.isActive
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                  ].join(" ")}
                >
                  {domain.isActive ? "active" : "inactive"}
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submitDomain} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={domainValue}
            onChange={(event) => setDomainValue(event.target.value)}
            placeholder="stud.satbayev.university"
            className="h-11 flex-1 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
          />

          <button
            type="submit"
            disabled={isAddingDomain}
            className="rounded-2xl bg-[#17384B] px-4 py-2 text-sm font-black text-white transition hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddingDomain ? "Добавляем..." : "Добавить домен"}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={onToggleStatus}
        disabled={isBusy}
        className={[
          "mt-5 rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
          university.status === UNIVERSITY_STATUS_ACTIVE
            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-[#17384B] text-white hover:bg-[#255B73]",
        ].join(" ")}
      >
        {isBusy
          ? "Обновляем..."
          : university.status === UNIVERSITY_STATUS_ACTIVE
            ? "Деактивировать"
            : "Активировать"}
      </button>
    </article>
  );
}

export default function AdminUniversitiesPage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [form, setForm] = useState<UniversityFormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UniversityStatus>("all");
  const [busyUniversityId, setBusyUniversityId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const universitiesQuery = useQuery(
    trpc.universities.adminList.queryOptions({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
      offset: 0,
    })
  );

  const universities = useMemo(
    () => (universitiesQuery.data?.items ?? []) as UniversityItem[],
    [universitiesQuery.data?.items]
  );

  const activeCount = universities.filter((item) => item.status === UNIVERSITY_STATUS_ACTIVE).length;
  const inactiveCount = universities.filter(
    (item) => item.status === UNIVERSITY_STATUS_INACTIVE
  ).length;
  const domainCount = universities.reduce(
    (sum, item) => sum + item.emailDomains.length,
    0
  );

  function patchForm(patch: Partial<UniversityFormState>): void {
    setForm((current) => ({ ...current, ...patch }));
  }

  function resetForm(): void {
    setForm(emptyForm);
  }

  async function submitUniversity(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const payload = {
      name: form.name.trim(),
      shortName: toNullable(form.shortName),
      officialNameRu: toNullable(form.officialNameRu),
      officialNameKz: toNullable(form.officialNameKz),
      officialNameEn: toNullable(form.officialNameEn),
      documentKeywords: splitKeywords(form.documentKeywordsText),
      city: toNullable(form.city),
      country: form.country.trim() || "Kazakhstan",
      status: form.status,
    };

    try {
      if (form.id) {
        await trpcClient.universities.adminUpdate.mutate({
          id: form.id,
          ...payload,
        });
        setMessage("Университет обновлён.");
      } else {
        await trpcClient.universities.adminCreate.mutate(payload);
        setMessage("Университет создан.");
      }

      resetForm();
      await universitiesQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось сохранить университет"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleUniversityStatus(university: UniversityItem): Promise<void> {
    setBusyUniversityId(university.id);
    setMessage(null);
    setError(null);

    try {
      if (university.status === UNIVERSITY_STATUS_ACTIVE) {
        await trpcClient.universities.adminDeactivate.mutate({
          id: university.id,
        });
      } else {
        await trpcClient.universities.adminUpdate.mutate({
          id: university.id,
          status: UNIVERSITY_STATUS_ACTIVE,
        });
      }

      setMessage("Статус университета обновлён.");
      await universitiesQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить статус университета"
      );
    } finally {
      setBusyUniversityId(null);
    }
  }

  async function addDomain(universityId: string, domain: string): Promise<void> {
    setMessage(null);
    setError(null);

    try {
      await trpcClient.universities.adminAddEmailDomain.mutate({
        universityId,
        domain,
      });
      setMessage("Email-домен добавлен.");
      await universitiesQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось добавить домен"
      );
    }
  }

  async function toggleDomain(domainId: string, isActive: boolean): Promise<void> {
    setMessage(null);
    setError(null);

    try {
      await trpcClient.universities.adminSetEmailDomainActive.mutate({
        id: domainId,
        isActive: !isActive,
      });
      setMessage("Email-домен обновлён.");
      await universitiesQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить домен"
      );
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
              Admin / Universities
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Справочник университетов
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Добавляйте университеты, официальные названия для студенческих
              билетов, ключевые слова и корпоративные email-домены.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{universities.length}</p>
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
              <p className="text-2xl font-black">{domainCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Domains
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={submitUniversity}
        className="ub-animate-fade-up ub-delay-100 rounded-[32px] border border-[#E5ECE9] bg-white/88 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md md:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
              {form.id ? "Редактирование" : "Новый университет"}
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#17384B]">
              {form.id ? "Обновить университет" : "Создать университет"}
            </h2>
          </div>

          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-[#D8E3DE] bg-white px-4 py-2 text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
            >
              Отменить редактирование
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Название для UI
            </span>
            <input
              value={form.name}
              onChange={(event) => patchForm({ name: event.target.value })}
              required
              minLength={2}
              maxLength={255}
              placeholder="Satbayev University"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Короткое название
            </span>
            <input
              value={form.shortName}
              onChange={(event) => patchForm({ shortName: event.target.value })}
              maxLength={100}
              placeholder="Satbayev"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Город
            </span>
            <input
              value={form.city}
              onChange={(event) => patchForm({ city: event.target.value })}
              maxLength={100}
              placeholder="Алматы"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Страна
            </span>
            <input
              value={form.country}
              onChange={(event) => patchForm({ country: event.target.value })}
              required
              maxLength={100}
              placeholder="Kazakhstan"
              className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Официальное название RU
            </span>
            <textarea
              value={form.officialNameRu}
              onChange={(event) => patchForm({ officialNameRu: event.target.value })}
              rows={4}
              placeholder="Казахский национальный исследовательский технический университет имени К.И. Сатпаева"
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-semibold leading-6 text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Официальное название KZ
            </span>
            <textarea
              value={form.officialNameKz}
              onChange={(event) => patchForm({ officialNameKz: event.target.value })}
              rows={4}
              placeholder="Қ.И. Сәтбаев атындағы Қазақ ұлттық техникалық зерттеу университеті"
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-semibold leading-6 text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Официальное название EN
            </span>
            <textarea
              value={form.officialNameEn}
              onChange={(event) => patchForm({ officialNameEn: event.target.value })}
              rows={3}
              placeholder="Kazakh National Research Technical University named after K. I. Satpayev"
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-semibold leading-6 text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>

          <label>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
              Ключевые слова документа
            </span>
            <textarea
              value={form.documentKeywordsText}
              onChange={(event) =>
                patchForm({ documentKeywordsText: event.target.value })
              }
              rows={3}
              placeholder={"сатпаев\nсәтбаев\nsatbayev"}
              className="mt-2 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm font-semibold leading-6 text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex w-fit items-center gap-2 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] px-4 py-3 text-sm font-black text-[#526470]">
            <input
              checked={form.status === UNIVERSITY_STATUS_ACTIVE}
              onChange={(event) =>
                patchForm({ status: event.target.checked
                    ? UNIVERSITY_STATUS_ACTIVE
                    : UNIVERSITY_STATUS_INACTIVE })
              }
              type="checkbox"
              className="h-4 w-4"
            />
            Активен
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ub-gradient-button rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Сохраняем..."
              : form.id
                ? "Сохранить изменения"
                : "Создать университет"}
          </button>
        </div>
      </form>

      <section className="rounded-[28px] border border-[#E5ECE9] bg-white/88 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, городу или official name..."
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | UniversityStatus)
            }
            className="h-12 rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-black text-[#17384B] outline-none transition focus:border-[#FFB5A4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
          >
            <option value="all">Все статусы</option>
            <option value={UNIVERSITY_STATUS_ACTIVE}>Активные</option>
            <option value={UNIVERSITY_STATUS_INACTIVE}>Выключенные</option>
          </select>
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

      {universitiesQuery.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          Не удалось загрузить университеты: {universitiesQuery.error.message}
        </div>
      )}

      {universitiesQuery.isLoading ? (
        <LoadingCards />
      ) : universities.length === 0 ? (
        <section className="ub-card rounded-[34px] p-8 text-center md:p-10">
          <h2 className="text-2xl font-black text-[#17384B]">
            Университетов пока нет
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#6B7280]">
            Создай первый университет, затем добавь его email-домены и
            образовательные программы.
          </p>
        </section>
      ) : (
        <section className="grid auto-rows-fr gap-4 lg:grid-cols-2">
          {universities.map((university) => (
            <UniversityCard
              key={university.id}
              university={university}
              isBusy={busyUniversityId === university.id}
              onEdit={() => {
                setForm(toForm(university));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onToggleStatus={() => {
                void toggleUniversityStatus(university);
              }}
              onAddDomain={(domain) => addDomain(university.id, domain)}
              onToggleDomain={toggleDomain}
            />
          ))}
        </section>
      )}

      {inactiveCount > 0 && (
        <p className="text-center text-sm font-semibold text-[#6B7280]">
          Выключенных университетов в текущем списке: {inactiveCount}.
        </p>
      )}
    </div>
  );
}
