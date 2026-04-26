"use client";

import Link from "next/link";
import { type FormEvent, type JSX, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";
import { AvatarUploadCard } from "@/components/media/avatar-upload-card";

type Degree = "" | "bachelor" | "master" | "phd" | "other";

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

function readApiErrorMessage(
  payload: unknown,
  fallback: string
): string {
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

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const response = await fetch(
        `${apiUrl}/student-verifications/document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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

  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1120px] px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
          Student Profile
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#17384B]">
          Профиль студента
        </h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Production-профиль: email берётся только из Clerk, а заявка на
          верификацию доступна только после заполнения всех обязательных полей.
        </p>
      </section>

      {profileQuery.isLoading ? (
        <div className="mt-6 rounded-[28px] bg-white p-6 text-[#6B7280]">
          Загружаем профиль...
        </div>
      ) : profileQuery.error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {profileQuery.error.message}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSave}
            className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
          >
            <h2 className="text-xl font-black text-[#17384B]">
              Основные данные
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-bold text-[#17384B]">Имя *</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Фамилия *
                </span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Отображаемое имя
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  minLength={2}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Телефон *
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+7 777 000 00 00"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>
            </div>

            <h2 className="mt-8 text-xl font-black text-[#17384B]">
              Студенческие данные
            </h2>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4">
                <p className="text-sm font-bold text-[#17384B]">
                  Студенческий email из Clerk *
                </p>
                <p className="mt-1 break-all font-mono text-sm text-[#526470]">
                  {profile?.user.email ?? "—"}
                </p>
                <p className="mt-2 text-xs text-[#6B7280]">
                  Domain: {domainCheck?.domain ?? "—"}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-sm font-semibold ${
                  isAllowedStudentEmail
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {isAllowedStudentEmail ? (
                  <>
                    Домен почты разрешён. Университет:{" "}
                    {domainCheck?.university?.shortName ||
                      domainCheck?.university?.name}
                  </>
                ) : (
                  <>
                    Домен почты не разрешён для студенческого доступа. Для
                    Satbayev используйте email вида{" "}
                    <span className="font-mono">
                      name@stud.satbayev.university
                    </span>
                    .
                  </>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Степень обучения *
                  </span>
                  <select
                    value={degree}
                    onChange={(event) => setDegree(event.target.value as Degree)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                  >
                    <option value="">Выберите степень</option>
                    <option value="bachelor">Бакалавриат</option>
                    <option value="master">Магистратура</option>
                    <option value="phd">Докторантура / PhD</option>
                    <option value="other">Другое</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Специальность *
                  </span>
                  <input
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    minLength={2}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Курс *
                  </span>
                  <input
                    value={course}
                    onChange={(event) => setCourse(event.target.value)}
                    type="number"
                    min="1"
                    max="8"
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Дата поступления *
                  </span>
                  <input
                    value={admissionDate}
                    onChange={(event) => setAdmissionDate(event.target.value)}
                    type="date"
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                  />
                </label>
              </div>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !isAllowedStudentEmail}
              className="mt-6 rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
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

            <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Готовность профиля
              </h2>

              <div className="mt-5 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-5">
                <p
                  className={`text-4xl font-black ${completionColor(
                    completion?.percentage ?? 0
                  )}`}
                >
                  {completion?.percentage ?? 0}%
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Заполнено {completion?.completedCount ?? 0} из{" "}
                  {completion?.totalCount ?? 0} обязательных пунктов
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#FF9F8A]"
                    style={{ width: `${completion?.percentage ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                {(completion?.requiredFields ?? []).map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between rounded-2xl bg-[#F9FAF8] px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-[#17384B]">
                      {field.label}
                    </span>
                    <span
                      className={
                        field.isComplete
                          ? "font-bold text-green-700"
                          : "font-bold text-red-700"
                      }
                    >
                      {field.isComplete ? "готово" : "нужно заполнить"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Статус верификации
              </h2>

              <div
                className={`mt-5 rounded-2xl border p-4 text-sm font-black ${statusClass(
                  studentProfile?.verificationStatus
                )}`}
              >
                {statusLabel(studentProfile?.verificationStatus)}
              </div>

              {studentProfile?.latestVerification && (
                <div className="mt-4 rounded-2xl bg-[#F9FAF8] p-4 text-sm text-[#6B7280]">
                  <p>
                    Последняя заявка:{" "}
                    <span className="font-bold text-[#17384B]">
                      {studentProfile.latestVerification.status}
                    </span>
                  </p>
                  <p className="mt-1">
                    Метод: {studentProfile.latestVerification.method}
                  </p>
                  {studentProfile.latestVerification.reviewComment && (
                    <p className="mt-1 text-red-700">
                      Комментарий:{" "}
                      {studentProfile.latestVerification.reviewComment}
                    </p>
                  )}
                </div>
              )}

              <label className="mt-5 block">
                <span className="text-sm font-bold text-[#17384B]">
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
                  <p className="font-bold text-[#17384B]">
                    {verificationDocument.name}
                  </p>
                  <p className="mt-1">
                    Размер: {(verificationDocument.size / 1024 / 1024).toFixed(2)} MB
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
                className="mt-5 w-full rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSubmittingVerification
                  ? "Загружаем..."
                  : "Загрузить PDF и отправить на проверку"}
              </button>

              {!canSubmitVerification && (
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                  Перед отправкой заявки заполните все обязательные поля
                  профиля и выберите PDF электронного студенческого.
                </p>
              )}
            </section>

            <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Следующий production-этап
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Следующий этап — загрузка PDF электронного студенческого и
                админская проверка документа.
              </p>
              <Link
                href="/catalog"
                className="mt-5 inline-flex rounded-2xl border border-[#D8E3DE] px-5 py-3 text-sm font-bold text-[#17384B]"
              >
                Перейти в каталог
              </Link>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
