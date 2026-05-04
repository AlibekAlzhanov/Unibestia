import type { ImagePickerAsset } from "expo-image-picker";

import { env } from "../../../shared/config/env";

type UploadAvatarParams = {
  token: string;
  asset: ImagePickerAsset;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
};

export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

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

function getMimeType(asset: ImagePickerAsset): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  const uri = asset.uri.toLowerCase();

  if (uri.endsWith(".png")) {
    return "image/png";
  }

  if (uri.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function getFileName(asset: ImagePickerAsset, mimeType: string): string {
  if (asset.fileName) {
    return asset.fileName;
  }

  const extension = mimeType === "image/png"
    ? "png"
    : mimeType === "image/webp"
      ? "webp"
      : "jpg";

  return `avatar-${Date.now()}.${extension}`;
}

export function validateAvatarAsset(asset: ImagePickerAsset): string | null {
  const mimeType = getMimeType(asset);

  if (!ALLOWED_AVATAR_MIME_TYPES.includes(mimeType as typeof ALLOWED_AVATAR_MIME_TYPES[number])) {
    return "Аватарка должна быть JPG, PNG или WEBP.";
  }

  if (typeof asset.fileSize === "number" && asset.fileSize > AVATAR_MAX_SIZE_BYTES) {
    return "Аватарка не должна превышать 2 MB.";
  }

  return null;
}

export async function uploadAvatarToBackend({
  token,
  asset,
}: UploadAvatarParams): Promise<unknown> {
  const mimeType = getMimeType(asset);
  const fileName = getFileName(asset, mimeType);

  const formData = new FormData();

  formData.append(
    "avatar",
    {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob
  );

  const uploadUrl = `${env.EXPO_PUBLIC_API_URL}/media/avatar`;

  console.log("[mobile/avatar] upload:", uploadUrl);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  console.log("[mobile/avatar] upload response:", payload);

  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, "Не удалось загрузить аватарку"));
  }

  return payload;
}
