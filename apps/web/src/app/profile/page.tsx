"use client";

import Link from "next/link";
import { type FormEvent, type JSX, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import { AvatarUploadCard } from "@/components/media/avatar-upload-card";

type Degree = "" | "bachelor" | "master" | "phd" | "other";

type ProfileCompletionField = {
  key: string;
  label: string;
  isComplete: boolean;
};

type ProfileData = {
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  roles: string[];
  allowedStudentEmailDomain: {
    email: string;
    domain: string;
    isAllowed: boolean;
    university: {
      id: string;
      name: string;
      shortName: string | null;
      city: string | null;
      country: string;
      status: string;
    } | null;
  };
  profileCompletion: {
    requiredFields: ProfileCompletionField[];
    missingFields: ProfileCompletionField[];
    completedCount: number;
    totalCount: number;
    percentage: number;
    isComplete: boolean;
    canSubmitVerification: boolean;
  };
  studentProfile: {
    id: string;
    universityId: string | null;
    studentEmail: string | null;
    degree: string | null;
    specialty: string | null;
    course: number | null;
    admissionDate: string | null;
    verificationStatus: string;
    verifiedAt: Date | string | null;
    verificationExpiresAt: Date | string | null;
    university: {
      id: string;
      name: string;
      shortName: string | null;
      city: string | null;
      country: string;
      status: string;
    } | null;
    latestVerification: {
      id: string;
      method: string;
      status: string;
      submittedEmail: string | null;
      documentUrl: string | null;
      documentType: string | null;
      reviewComment: string | null;
      reviewedByUserId: string | null;
      reviewedAt: Date | string | null;
      expiresAt: Date | string | null;
      createdAt: Date | string;
      updatedAt: Date | string;
    } | null;
  } | null;
};

function toDegree(value: string | null | undefined): Degree {
  if (
    value === "bachelor" ||
    value === "master" ||
    value === "phd" ||
    value === "other"
  ) {
    return value;
  }

  return "";
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message === "[object Object]" ? fallback : error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const errorRecord = error as Record<string, unknown>;
    const message = errorRecord.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    const errorText = errorRecord.error;

    if (typeof errorText === "string") {
      return errorText;
    }

    try {
      return JSON.stringify(errorRecord);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const payloadRecord = payload as Record<string, unknown>;
    const message = payloadRecord.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    const error = payloadRecord.error;

    if (typeof error === "string") {
      return error;
    }

    try {
      return JSON.stringify(payloadRecord);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function statusLabel(status?: string | null): string {
  const labels: Record<string, string> = {
    unverified: "Не подтверждён",
    pending_review: "На проверке",
    verified: "Подтверждён",
    rejected: "Отклонён",
    expired: "Истёк",
  };

  return status ? labels[status] ?? status : "Профиль не заполнен";
}

function statusClass(status?: string | null): string {
  if (status === "verified") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "pending_review") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "rejected" || status === "expired") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-[#E5ECE9] bg-[#F7F6F1] text-[#526470]";
}

function parseOptionalCourse(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function completionColor(percentage: number): string {
  if (percentage >= 100) {
    return "text-green-700";
  }

  if (percentage >= 70) {
    return "text-yellow-700";
  }

  return "text-red-700";
}

function degreeLabel(value?: string | null): string {
  const labels: Record<string, string> = {
    bachelor: "Бакалавриат",
    master: "Магистратура",
    phd: "Докторантура / PhD",
    other: "Другое",
  };

  return value ? labels[value] ?? value : "Не указано";
}

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("ru-RU");
}

function LoadingProfile(): JSX.Element {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="ub-card rounded-[34px] p-7">
        <div className="ub-skeleton h-6 w-52 rounded-full" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <div className="ub-skeleton h-4 w-24 rounded-full" />
              <div className="ub-skeleton mt-2 h-12 rounded-2xl" />
            </div>
          ))}
        </div>
      </section>

      <aside className="grid gap-6">
        <section className="ub-card rounded-[34px] p-7">
          <div className="ub-skeleton h-20 w-20 rounded-3xl" />
          <div className="ub-skeleton mt-5 h-5 w-2/3 rounded-full" />
          <div className="ub-skeleton mt-3 h-4 w-full rounded-full" />
        </section>

        <section className="ub-card rounded-[34px] p-7">
          <div className="ub-skeleton h-8 w-28 rounded-full" />
          <div className="ub-skeleton mt-5 h-3 w-full rounded-full" />
          <div className="ub-skeleton mt-4 h-12 rounded-2xl" />
        </section>
      </aside>
    </div>
  );
}

export default function ProfilePage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { getToken } = useAuth();

  const profileQuery = useQuery(trpc.profile.getMyProfile.queryOptions());

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [degree, setDegree] = useState<Degree>("");
  const [specialty, setSpecialty] = useState("");
  const [course, setCourse] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [verificationDocument, setVerificationDocument] =
    useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profile = profileQuery.data as ProfileData | undefined;
  const studentProfile = profile?.studentProfile;
  const domainCheck = profile?.allowedStudentEmailDomain;
  const completion = profile?.profileCompletion;
  const isAllowedStudentEmail = Boolean(domainCheck?.isAllowed);
  const canSubmitVerification = Boolean(completion?.canSubmitVerification);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFirstName(profile.user.firstName ?? "");
    setLastName(profile.user.lastName ?? "");
    setDisplayName(profile.user.displayName ?? "");
    setPhone(profile.user.phone ?? "");

    if (studentProfile) {
      setDegree(toDegree(studentProfile.degree));
      setSpecialty(studentProfile.specialty ?? "");
      setCourse(studentProfile.course ? String(studentProfile.course) : "");
      setAdmissionDate(studentProfile.admissionDate ?? "");
    }
  }, [profile, studentProfile]);

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.profile.upsertMyStudentProfile.mutate({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        displayName: displayName.trim() || undefined,
        phone: phone.trim() || undefined,
        degree: degree === "" ? undefined : degree,
        specialty: specialty.trim() || undefined,
        course: parseOptionalCourse(course),
        admissionDate: admissionDate || undefined,
      });

      setMessage("Профиль студента сохранён.");
      await profileQuery.refetch();
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось сохранить профиль"));
    } finally {
      setIsSaving(false);
    }
  }

  async function submitVerification(): Promise<void> {
    if (!verificationDocument) {
      setError("Загрузите PDF электронного студенческого.");
      return;
    }

    if (verificationDocument.type !== "application/pdf") {
      setError("Можно загрузить только PDF файл.");
      return;
    }

    if (verificationDocument.size > 5 * 1024 * 1024) {
      setError("PDF файл не должен превышать 5 MB.");
      return;
    }

    setIsSubmittingVerification(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const formData = new FormData();
      formData.append("document", verificationDocument);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const response = await fetch(`${apiUrl}/student-verifications/document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(
          readApiErrorMessage(payload, "Не удалось загрузить PDF")
        );
      }

      setMessage("PDF электронного студенческого отправлен на проверку.");
      setVerificationDocument(null);
      await profileQuery.refetch();
    } catch (caughtError) {
      setError(
        readErrorMessage(caughtError, "Не удалось отправить PDF на проверку")
      );
    } finally {
      setIsSubmittingVerification(false);
    }
  }

  const completionPercent = completion?.percentage ?? 0;
  const universityName =
    domainCheck?.university?.shortName ||
    domainCheck?.university?.name ||
    studentProfile?.university?.shortName ||
    studentProfile?.university?.name ||
    "Не определён";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <section className="ub-animate-fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#17384B_0%,#255B73_52%,#FF9F8A_130%)] p-6 text-white shadow-[0_24px_70px_rgba(23,56,75,0.24)] md:p-10">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-[#A6EFEE]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF9F8A]/24 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-[#FFB5A4]">
              Student Profile
            </p>

            <h1 className="max-w-3xl text-[34px] font-black leading-tight tracking-[-0.04em] md:text-5xl">
              Профиль студента UniBestia
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#DDE8EA]">
              Заполни данные, подтверди студенческий статус и получай доступ к
              QR-скидкам, бонусам и персональной истории использований.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="text-2xl font-black">{completionPercent}%</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Готовность
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="truncate text-2xl font-black">
                {statusLabel(studentProfile?.verificationStatus)}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Статус
              </p>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 backdrop-blur-md">
              <p className="truncate text-2xl font-black">
                {isAllowedStudentEmail ? "OK" : "NO"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#DDE8EA]">
                Домен
              </p>
            </div>
          </div>
        </div>
      </section>

      {profileQuery.isLoading ? (
        <LoadingProfile />
      ) : profileQuery.error ? (
        <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-sm font-black uppercase tracking-[0.14em]">
            Ошибка загрузки
          </p>
          <p className="mt-2 text-sm leading-6">{profileQuery.error.message}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <form
            onSubmit={handleSave}
            className="ub-animate-fade-up ub-card self-start rounded-[34px] p-6 md:p-7"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                  Основные данные
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                  Личная информация
                </h2>
              </div>

              <span
                className={[
                  "w-fit rounded-full border px-3 py-1 text-xs font-black",
                  statusClass(studentProfile?.verificationStatus),
                ].join(" ")}
              >
                {statusLabel(studentProfile?.verificationStatus)}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-black text-[#17384B]">Имя *</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Фамилия *
                </span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Отображаемое имя
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Телефон *
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+7 777 000 00 00"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>
            </div>

            <div className="mt-8 rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9CA3AF]">
                Студенческий email из Clerk
              </p>

              <p className="mt-3 break-all font-mono text-sm font-bold text-[#17384B]">
                {profile?.user.email ?? "—"}
              </p>

              <div
                className={[
                  "mt-4 rounded-2xl border p-4 text-sm leading-6",
                  isAllowedStudentEmail
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700",
                ].join(" ")}
              >
                {isAllowedStudentEmail ? (
                  <>
                    Домен почты разрешён. Университет:{" "}
                    <span className="font-black">{universityName}</span>
                  </>
                ) : (
                  <>
                    Домен почты не разрешён для студенческого доступа. Для
                    Satbayev используйте email вида{" "}
                    <span className="font-mono font-black">
                      name@stud.satbayev.university
                    </span>
                    .
                  </>
                )}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                Учёба
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                Студенческие данные
              </h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Степень обучения *
                </span>
                <select
                  value={degree}
                  onChange={(event) => setDegree(event.target.value as Degree)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                >
                  <option value="">Выберите степень</option>
                  <option value="bachelor">Бакалавриат</option>
                  <option value="master">Магистратура</option>
                  <option value="phd">Докторантура / PhD</option>
                  <option value="other">Другое</option>
                </select>
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Специальность *
                </span>
                <input
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Курс *
                </span>
                <input
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  type="number"
                  min="1"
                  max="8"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>

              <label>
                <span className="text-sm font-black text-[#17384B]">
                  Дата поступления *
                </span>
                <input
                  value={admissionDate}
                  onChange={(event) => setAdmissionDate(event.target.value)}
                  type="date"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm font-semibold text-[#17384B] outline-none transition focus:border-[#FF9F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,159,138,0.14)]"
                />
              </label>
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !isAllowedStudentEmail}
              className="ub-gradient-button mt-7 rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Сохраняем..." : "Сохранить профиль"}
            </button>
          </form>

          <aside className="grid gap-6">
            <AvatarUploadCard
              avatarUrl={profile?.user.avatarUrl ?? null}
              displayName={profile?.user.displayName ?? null}
              email={profile?.user.email ?? null}
              onUploaded={() => profileQuery.refetch()}
            />

            <section className="ub-card rounded-[34px] p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                    Progress
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                    Готовность профиля
                  </h2>
                </div>

                <p
                  className={[
                    "text-4xl font-black",
                    completionColor(completionPercent),
                  ].join(" ")}
                >
                  {completionPercent}%
                </p>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F7F6F1]">
                <div
                  className="h-full rounded-full bg-[#FF9F8A] transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Заполнено {completion?.completedCount ?? 0} из{" "}
                {completion?.totalCount ?? 0} обязательных пунктов.
              </p>

              <div className="mt-5 grid gap-2">
                {(completion?.requiredFields ?? []).map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9FAF8] px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-[#17384B]">
                      {field.label}
                    </span>

                    <span
                      className={
                        field.isComplete
                          ? "shrink-0 font-black text-green-700"
                          : "shrink-0 font-black text-red-700"
                      }
                    >
                      {field.isComplete ? "готово" : "нужно"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="ub-card rounded-[34px] p-6 md:p-7">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
                Verification
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                Верификация студента
              </h2>

              <div
                className={[
                  "mt-5 rounded-2xl border p-4 text-sm font-black",
                  statusClass(studentProfile?.verificationStatus),
                ].join(" ")}
              >
                {statusLabel(studentProfile?.verificationStatus)}
              </div>

              <div className="mt-4 grid gap-3 rounded-[26px] bg-[#F9FAF8] p-4 text-sm text-[#526470]">
                <div className="flex items-center justify-between gap-4">
                  <span>Университет</span>
                  <span className="font-black text-[#17384B]">
                    {universityName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span>Степень</span>
                  <span className="font-black text-[#17384B]">
                    {degreeLabel(studentProfile?.degree)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span>Проверен</span>
                  <span className="font-black text-[#17384B]">
                    {formatDate(studentProfile?.verifiedAt)}
                  </span>
                </div>
              </div>

              {studentProfile?.latestVerification && (
                <div className="mt-4 rounded-2xl border border-[#E5ECE9] bg-white p-4 text-sm text-[#6B7280]">
                  <p>
                    Последняя заявка:{" "}
                    <span className="font-black text-[#17384B]">
                      {studentProfile.latestVerification.status}
                    </span>
                  </p>

                  <p className="mt-1">
                    Метод: {studentProfile.latestVerification.method}
                  </p>

                  {studentProfile.latestVerification.reviewComment && (
                    <p className="mt-2 rounded-2xl bg-red-50 p-3 text-red-700">
                      {studentProfile.latestVerification.reviewComment}
                    </p>
                  )}
                </div>
              )}

              <label className="mt-5 block">
                <span className="text-sm font-black text-[#17384B]">
                  PDF электронного студенческого *
                </span>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) =>
                    setVerificationDocument(event.target.files?.[0] ?? null)
                  }
                  disabled={!canSubmitVerification}
                  className="mt-2 block w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm text-[#526470] file:mr-4 file:rounded-xl file:border-0 file:bg-[#17384B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white disabled:opacity-60"
                />
              </label>

              {verificationDocument && (
                <div className="mt-3 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm text-[#526470]">
                  <p className="font-black text-[#17384B]">
                    {verificationDocument.name}
                  </p>

                  <p className="mt-1">
                    Размер:{" "}
                    {(verificationDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={submitVerification}
                disabled={
                  isSubmittingVerification ||
                  !isAllowedStudentEmail ||
                  !canSubmitVerification ||
                  !verificationDocument ||
                  studentProfile?.verificationStatus === "pending_review" ||
                  studentProfile?.verificationStatus === "verified"
                }
                className="mt-5 w-full rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(23,56,75,0.18)] transition hover:-translate-y-0.5 hover:bg-[#255B73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingVerification
                  ? "Загружаем..."
                  : "Загрузить PDF и отправить на проверку"}
              </button>

              {!canSubmitVerification && (
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                  Перед отправкой заявки нужно заполнить обязательные поля
                  профиля и выбрать PDF электронного студенческого.
                </p>
              )}
            </section>

            <section className="rounded-[34px] border border-[#E5ECE9] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF7F4_100%)] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)] md:p-7">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF7F6E]">
                Быстрый переход
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#17384B]">
                Что дальше?
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#6B7280]">
                После сохранения профиля и верификации можно переходить к
                каталогу, получать QR-коды и отслеживать свои скидки.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/catalog"
                  className="rounded-2xl bg-[#17384B] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#255B73]"
                >
                  Каталог
                </Link>

                <Link
                  href="/my-redemptions"
                  className="rounded-2xl border border-[#D8E3DE] bg-white px-5 py-3 text-center text-sm font-black text-[#17384B] transition hover:bg-[#F7F6F1]"
                >
                  Мои скидки
                </Link>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}