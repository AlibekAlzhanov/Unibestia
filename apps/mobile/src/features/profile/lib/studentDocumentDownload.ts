import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type DownloadStudentDocumentParams = {
  token: string;
  url: string;
  verificationId?: string | null;
};

function makeSafeFileName(verificationId?: string | null): string {
  const suffix = verificationId?.replace(/[^a-zA-Z0-9_-]/g, "") || Date.now().toString();

  return `student-verification-${suffix}.pdf`;
}

export async function downloadAndOpenStudentDocument({
  token,
  url,
  verificationId,
}: DownloadStudentDocumentParams): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("На этом устройстве недоступно открытие PDF файла.");
  }

  const cacheDirectory = FileSystem.cacheDirectory;

  if (!cacheDirectory) {
    throw new Error("Не удалось получить cache directory для PDF файла.");
  }

  const fileUri = `${cacheDirectory}${makeSafeFileName(verificationId)}`;

  const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf",
    },
  });

  if (downloadResult.status < 200 || downloadResult.status >= 300) {
    throw new Error(`Backend вернул статус ${downloadResult.status} при загрузке PDF.`);
  }

  await Sharing.shareAsync(downloadResult.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Открыть PDF студенческого",
  });
}
