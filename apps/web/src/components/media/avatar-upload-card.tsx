"use client";

import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { type JSX, useMemo, useState } from "react";
import { getBackendApiUrl } from "@/utils/backend-api-url";

type AvatarUploadCardProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  onUploaded?: () => Promise<unknown> | unknown;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
};

function readApiError(payload: unknown, fallback: string): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const data = payload as ApiErrorPayload;

    if (Array.isArray(data.message)) {
      return data.message.join(", ");
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    if (typeof data.error === "string") {
      return data.error;
    }
  }

  return fallback;
}

function makeInitials(displayName?: string | null, email?: string | null): string {
  const source = displayName?.trim() || email?.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AvatarUploadCard({
  avatarUrl,
  displayName,
  email,
  onUploaded,
}: AvatarUploadCardProps): JSX.Element {
  const { getToken } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(
    () => makeInitials(displayName, email),
    [displayName, email]
  );

  const previewUrl = useMemo(() => {
    if (!avatarFile) {
      return null;
    }

    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  async function uploadAvatar(): Promise<void> {
    if (!avatarFile) {
      setError("Выберите фото профиля.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type)) {
      setError("Аватарка должна быть JPG, PNG или WEBP.");
      return;
    }

    if (avatarFile.size > 2 * 1024 * 1024) {
      setError("Аватарка не должна превышать 2 MB.");
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch(`${getBackendApiUrl()}/media/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(readApiError(payload, "Не удалось загрузить аватарку"));
      }

      setAvatarFile(null);
      setMessage("Аватарка обновлена.");

      window.dispatchEvent(new Event("unibestia-avatar-updated"));

      await onUploaded?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось загрузить аватарку"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="ub-card rounded-[34px] p-6 md:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Avatar
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Аватарка профиля
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Фото будет отображаться в профиле, верхней панели и личном кабинете.
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#FFF0EB] px-3 py-1 text-xs font-black text-[#FF7F6E]">
          до 2 MB
        </span>
      </div>

      <div className="mt-6 rounded-[28px] border border-[#E5ECE9] bg-[#F9FAF8] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-24 w-24 shrink-0 sm:mx-0">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Предпросмотр аватарки"
                width={96}
                height={96}
                sizes="96px"
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
              />
            ) : avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Аватарка пользователя"
                width={96}
                height={96}
                sizes="96px"
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,#17384B,#FF9F8A)] text-2xl font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                {initials}
              </div>
            )}

            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500" />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-base font-black text-[#17384B]">
              {displayName || email || "Пользователь"}
            </p>

            <p className="mt-1 truncate text-sm text-[#6B7280]">
              {email || "email не указан"}
            </p>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              JPG, PNG или WEBP
            </p>
          </div>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-black text-[#17384B]">Фото профиля</span>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm text-[#526470] file:mr-4 file:rounded-xl file:border-0 file:bg-[#17384B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
        />
      </label>

      {avatarFile && (
        <div className="mt-3 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm text-[#526470]">
          <p className="font-black text-[#17384B]">{avatarFile.name}</p>
          <p className="mt-1">
            Размер: {(avatarFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={uploadAvatar}
        disabled={isUploading || !avatarFile}
        className="ub-gradient-button mt-5 w-full rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "Загружаем..." : "Загрузить аватарку"}
      </button>
    </section>
  );
}