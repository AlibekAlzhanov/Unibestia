import type { DocumentPickerAsset } from "expo-document-picker";

import { env } from "../../../shared/config/env";

type UploadStudentDocumentParams = {
  token: string;
  asset: DocumentPickerAsset;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
};

export const STUDENT_DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function readApiErrorMessage(payload: unknown, fallback: string): string {
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

export function formatDocumentSize(bytes?: number | null): string {
  if (!bytes) {
    return "размер неизвестен";
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function validateStudentDocumentAsset(
  asset: DocumentPickerAsset
): string | null {
  const mimeType = asset.mimeType ?? "";

  if (mimeType && mimeType !== "application/pdf") {
    return "Можно загрузить только PDF файл.";
  }

  if (!asset.name.toLowerCase().endsWith(".pdf") && mimeType !== "application/pdf") {
    return "Можно загрузить только PDF файл.";
  }

  if (typeof asset.size === "number" && asset.size > STUDENT_DOCUMENT_MAX_SIZE_BYTES) {
    return "PDF файл не должен превышать 5 MB.";
  }

  return null;
}

export async function uploadStudentDocumentToBackend({
  token,
  asset,
}: UploadStudentDocumentParams): Promise<unknown> {
  const formData = new FormData();

  formData.append(
    "document",
    {
      uri: asset.uri,
      name: asset.name || `student-document-${Date.now()}.pdf`,
      type: asset.mimeType || "application/pdf",
    } as unknown as Blob
  );

  const uploadUrl = `${env.EXPO_PUBLIC_API_URL}/student-verifications/document`;

  console.log("[mobile/student-document] upload:", uploadUrl);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  console.log("[mobile/student-document] upload response:", payload);

  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, "Не удалось загрузить PDF студенческого")
    );
  }

  return payload;
}
