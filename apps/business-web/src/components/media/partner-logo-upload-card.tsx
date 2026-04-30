"use client";

/* eslint-disable @next/next/no-img-element */

import { type ChangeEvent, type JSX, useMemo, useRef, useState } from "react";
import { getBackendApiUrl } from "@/utils/backend-api-url";

type TokenGetter = () => Promise<string | null>;

type PartnerLogoUploadCardProps = {
  logoUrl?: string | null;
  getToken: TokenGetter;
  onUploaded?: () => Promise<unknown> | unknown;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxLogoSizeBytes = 2 * 1024 * 1024;

function readApiMessage(payload: unknown, fallback: string): string {
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

function validateLogoFile(file: File): string | null {
  if (!allowedImageTypes.includes(file.type)) {
    return "Логотип должен быть JPG, PNG или WEBP.";
  }

  if (file.size > maxLogoSizeBytes) {
    return "Логотип не должен превышать 2 MB.";
  }

  return null;
}

export function PartnerLogoUploadCard({
  logoUrl,
  getToken,
  onUploaded,
}: PartnerLogoUploadCardProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!logoFile) {
      return null;
    }

    return URL.createObjectURL(logoFile);
  }, [logoFile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
    setMessage(null);
    setError(null);
  }

  async function uploadLogo(): Promise<void> {
    if (!logoFile) {
      setError("Выберите логотип.");
      return;
    }

    const validationError = validateLogoFile(logoFile);

    if (validationError) {
      setError(validationError);
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
      formData.append("logo", logoFile);

      const response = await fetch(`${getBackendApiUrl()}/media/partner/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(readApiMessage(payload, "Не удалось загрузить логотип"));
      }

      setLogoFile(null);
      setMessage("Логотип партнёра обновлён.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await onUploaded?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось загрузить логотип"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="ub-card rounded-[34px] p-6 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9CA3AF]">
            Brand logo
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#17384B]">
            Логотип бренда
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Логотип будет отображаться в карточках скидок, партнёрском кабинете
            и списках модерации.
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
              <img
                src={previewUrl}
                alt="Предпросмотр логотипа"
                className="h-24 w-24 rounded-[28px] border-4 border-white object-cover shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
              />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Логотип партнёра"
                className="h-24 w-24 rounded-[28px] border-4 border-white object-cover shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-white bg-[linear-gradient(135deg,#17384B,#FF9F8A)] text-center text-xs font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                No logo
              </div>
            )}

            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500" />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-base font-black text-[#17384B]">
              {logoFile ? logoFile.name : "Фирменный знак партнёра"}
            </p>

            <p className="mt-1 text-sm leading-6 text-[#6B7280]">
              Используйте квадратное изображение, чтобы логотип хорошо смотрелся
              в карточках скидок.
            </p>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              JPG, PNG или WEBP
            </p>
          </div>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-black text-[#17384B]">
          Файл логотипа
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="mt-2 block w-full rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm text-[#526470] file:mr-4 file:rounded-xl file:border-0 file:bg-[#17384B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
        />
      </label>

      {logoFile && (
        <div className="mt-3 rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] p-4 text-sm text-[#526470]">
          <p className="font-black text-[#17384B]">{logoFile.name}</p>
          <p className="mt-1">
            Размер: {(logoFile.size / 1024 / 1024).toFixed(2)} MB
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
        onClick={uploadLogo}
        disabled={isUploading || !logoFile}
        className="ub-gradient-button mt-5 w-full rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "Загружаем..." : "Загрузить логотип"}
      </button>
    </section>
  );
}