"use client";

/* eslint-disable @next/next/no-img-element */

import { type ChangeEvent, type JSX, useRef, useState } from "react";
import { getBackendApiUrl } from "@/utils/backend-api-url";

type TokenGetter = () => Promise<string | null>;

type PartnerLogoUploadCardProps = {
  logoUrl?: string | null;
  getToken: TokenGetter;
  onUploaded?: () => Promise<unknown> | unknown;
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxLogoSizeBytes = 2 * 1024 * 1024;

function readApiMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
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
    <section className="mt-6 rounded-[28px] bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#17384B]">Логотип бренда</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Логотип будет отображаться в карточках скидок и кабинете партнёра.
          </p>
        </div>

        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Логотип партнёра"
            className="h-20 w-20 rounded-2xl border border-[#E5ECE9] object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E5ECE9] bg-[#F9FAF8] text-xs font-bold text-[#94A3B8]">
            Нет лого
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="rounded-2xl border border-[#D8E3DE] bg-[#F9FAF8] px-4 py-3 text-sm text-[#526470] file:mr-4 file:rounded-xl file:border-0 file:bg-[#17384B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
        />

        <button
          type="button"
          onClick={uploadLogo}
          disabled={isUploading || !logoFile}
          className="rounded-2xl bg-[#FF9F8A] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isUploading ? "Загружаем..." : "Загрузить"}
        </button>
      </div>

      {logoFile && (
        <p className="mt-3 text-sm text-[#6B7280]">
          {logoFile.name} · {(logoFile.size / 1024 / 1024).toFixed(2)} MB
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
    </section>
  );
}
