"use client";

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

  async function uploadAvatar(): Promise<void> {
    if (!avatarFile) {
      setError("Выберите фото профиля.");
      return;
    }

    if (![
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(avatarFile.type)) {
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
    <section className="rounded-[32px] bg-white p-7 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-black text-[#17384B]">Аватарка профиля</h2>
      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
        Фото будет отображаться в профиле и в верхней панели сайта.
      </p>

      <div className="mt-5 flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Аватарка пользователя"
            className="h-24 w-24 rounded-full border border-[#E5ECE9] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#E5ECE9] bg-[#17384B] text-2xl font-black text-white">
            {initials}
          </div>
        )}

        <div>
          <p className="font-bold text-[#17384B]">
            {displayName || email || "Пользователь"}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            JPG, PNG или WEBP до 2 MB.
          </p>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-[#17384B]">Фото профиля</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm text-[#526470] file:mr-4 file:rounded-xl file:border-0 file:bg-[#17384B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
        />
      </label>

      {avatarFile && (
        <p className="mt-3 text-sm text-[#6B7280]">
          {avatarFile.name} · {(avatarFile.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}

      {message && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={uploadAvatar}
        disabled={isUploading || !avatarFile}
        className="mt-5 w-full rounded-2xl bg-[#17384B] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isUploading ? "Загружаем..." : "Загрузить аватарку"}
      </button>
    </section>
  );
}
