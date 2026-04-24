"use client";

import Link from "next/link";
import { type FormEvent, type JSX, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/utils/trpc";

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

export default function ProfilePage(): JSX.Element {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const profileQuery = useQuery(trpc.profile.getMyProfile.queryOptions());

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentCardNumber, setStudentCardNumber] = useState("");
  const [faculty, setFaculty] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [course, setCourse] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profile = profileQuery.data;
  const studentProfile = profile?.studentProfile;
  const domainCheck = profile?.allowedStudentEmailDomain;
  const isAllowedStudentEmail = Boolean(domainCheck?.isAllowed);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFirstName(profile.user.firstName ?? "");
    setLastName(profile.user.lastName ?? "");
    setDisplayName(profile.user.displayName ?? "");
    setPhone(profile.user.phone ?? "");

    if (studentProfile) {
      setStudentCardNumber(studentProfile.studentCardNumber ?? "");
      setFaculty(studentProfile.faculty ?? "");
      setSpecialty(studentProfile.specialty ?? "");
      setCourse(studentProfile.course ? String(studentProfile.course) : "");
      setGroupName(studentProfile.groupName ?? "");
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
        studentCardNumber: studentCardNumber.trim() || undefined,
        faculty: faculty.trim() || undefined,
        specialty: specialty.trim() || undefined,
        course: parseOptionalCourse(course),
        groupName: groupName.trim() || undefined,
      });

      setMessage("Профиль студента сохранён.");
      await profileQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось сохранить профиль"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitVerification(): Promise<void> {
    setIsSubmittingVerification(true);
    setMessage(null);
    setError(null);

    try {
      await trpcClient.profile.submitStudentVerification.mutate({
        method: "edu_email",
      });

      setMessage("Заявка на проверку студенческой почты отправлена.");
      await profileQuery.refetch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отправить заявку"
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
          Студенческая почта берётся только из Clerk-аккаунта и не редактируется
          вручную. Сейчас разрешён только домен{" "}
          <span className="font-bold text-[#17384B]">
            stud.satbayev.university
          </span>
          .
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
                <span className="text-sm font-bold text-[#17384B]">Имя</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Фамилия
                </span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
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
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Телефон
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
                  Студенческий email из Clerk
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

              <label>
                <span className="text-sm font-bold text-[#17384B]">
                  Номер студенческого
                </span>
                <input
                  value={studentCardNumber}
                  onChange={(event) => setStudentCardNumber(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Факультет
                  </span>
                  <input
                    value={faculty}
                    onChange={(event) => setFaculty(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Специальность
                  </span>
                  <input
                    value={specialty}
                    onChange={(event) => setSpecialty(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 text-sm outline-none focus:border-[#FF9F8A]"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-[#17384B]">
                    Курс
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
                    Группа
                  </span>
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
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

              <button
                type="button"
                onClick={submitVerification}
                disabled={
                  isSubmittingVerification ||
                  !isAllowedStudentEmail ||
                  !studentProfile
                }
                className="mt-5 w-full rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSubmittingVerification
                  ? "Отправляем..."
                  : "Отправить заявку на проверку email"}
              </button>

              {!studentProfile && (
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                  Сначала сохраните профиль студента.
                </p>
              )}
            </section>

            <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-black text-[#17384B]">
                Следующий production-этап
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                На следующем этапе добавим загрузку PDF электронного
                студенческого и админскую проверку документа.
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
