"use client";

import { type ChangeEvent, type JSX, useRef, useState } from "react";
import { getBackendApiUrl } from "@/utils/backend-api-url";

type TokenGetter = () => Promise<string | null>;

type OfferImageUploadButtonProps = {
  offerId: string;
  getToken: TokenGetter;
  onUploaded?: () => Promise<unknown> | unknown;
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxOfferImageSizeBytes = 5 * 1024 * 1024;

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

function validateOfferImage(file: File): string | null {
  if (!allowedImageTypes.includes(file.type)) {
    return "Фото скидки должно быть JPG, PNG или WEBP.";
  }

  if (file.size > maxOfferImageSizeBytes) {
    return "Фото скидки не должно превышать 5 MB.";
  }

  return null;
}

export function OfferImageUploadButton({
  offerId,
  getToken,
  onUploaded,
}: OfferImageUploadButtonProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setMessage(null);
    setError(null);
  }

  async function uploadImage(): Promise<void> {
    if (!selectedFile) {
      setError("Выберите фото скидки.");
      return;
    }

    const validationError = validateOfferImage(selectedFile);

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
      formData.append("image", selectedFile);

      const response = await fetch(
        `${getBackendApiUrl()}/media/offers/${offerId}/images`,
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
        throw new Error(readApiMessage(payload, "Не удалось загрузить фото скидки"));
      }

      setSelectedFile(null);
      setMessage("Фото загружено.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await onUploaded?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось загрузить фото скидки"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="block w-full text-xs text-[#526470] file:mr-2 file:rounded-xl file:border-0 file:bg-[#17384B] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
      />

      {selectedFile && (
        <p className="text-xs text-[#6B7280]">
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}

      <button
        type="button"
        onClick={uploadImage}
        disabled={isUploading || !selectedFile}
        className="w-fit rounded-xl bg-[#FF9F8A] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        {isUploading ? "Загрузка..." : "Загрузить фото"}
      </button>

      {message && <p className="text-xs font-bold text-green-700">{message}</p>}
      {error && <p className="text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}
