import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@clerk/clerk-expo";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { downloadAndOpenStudentDocument } from "../lib/studentDocumentDownload";
import {
  formatDocumentSize,
  STUDENT_DOCUMENT_MAX_SIZE_BYTES,
  uploadStudentDocumentToBackend,
  validateStudentDocumentAsset,
} from "../lib/studentDocumentUpload";
import {
  formatVerificationDate,
  readLatestVerificationCreatedAt,
  readLatestVerificationDocumentType,
  readLatestVerificationDocumentUrl,
  readLatestVerificationId,
  readLatestVerificationMethod,
  readLatestVerificationReviewComment,
  readLatestVerificationStatus,
  verificationRequestStatusLabel,
} from "../lib/verificationDocumentView";

type StudentDocumentUploadCardProps = {
  profile: unknown;
  canSubmitVerification: boolean;
  onUploaded?: () => Promise<unknown> | unknown;
};

export function StudentDocumentUploadCard({
  profile,
  canSubmitVerification,
  onUploaded,
}: StudentDocumentUploadCardProps) {
  const { getToken } = useAuth();

  const [selectedAsset, setSelectedAsset] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latestVerificationId = readLatestVerificationId(profile);
  const latestStatus = readLatestVerificationStatus(profile);
  const latestMethod = readLatestVerificationMethod(profile);
  const latestDocumentUrl = readLatestVerificationDocumentUrl(profile);
  const latestDocumentType = readLatestVerificationDocumentType(profile);
  const latestReviewComment = readLatestVerificationReviewComment(profile);
  const latestCreatedAt = readLatestVerificationCreatedAt(profile);

  async function pickDocument(): Promise<void> {
    setMessage(null);
    setError(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset) {
      setError("Не удалось выбрать PDF файл.");
      return;
    }

    const validationError = validateStudentDocumentAsset(asset);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedAsset(asset);
  }

  async function uploadDocument(): Promise<void> {
    if (!selectedAsset) {
      setError("Выбери PDF электронного студенческого.");
      return;
    }

    const validationError = validateStudentDocumentAsset(selectedAsset);

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

      await uploadStudentDocumentToBackend({
        token,
        asset: selectedAsset,
      });

      setSelectedAsset(null);
      setMessage("PDF электронного студенческого отправлен на проверку.");
      await onUploaded?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось отправить PDF на проверку"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function openLatestDocument(): Promise<void> {
    setMessage(null);
    setError(null);

    if (!latestDocumentUrl) {
      setError("Backend не вернул ссылку на PDF документ.");
      return;
    }

    setIsOpening(true);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      await downloadAndOpenStudentDocument({
        token,
        url: latestDocumentUrl,
        verificationId: latestVerificationId,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось открыть текущий PDF"
      );
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="document-attach-outline" tone="primary" />

        <View style={styles.headerText}>
          <AppText variant="subheading">PDF электронного студенческого</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Загрузи PDF-документ как на сайте. Он будет отправлен на проверку
            администратору.
          </AppText>
        </View>

        <View style={styles.limitBadge}>
          <AppText variant="caption" color={colors.accent}>
            до {Math.round(STUDENT_DOCUMENT_MAX_SIZE_BYTES / 1024 / 1024)} MB
          </AppText>
        </View>
      </View>

      <View style={styles.statusBox}>
        <View style={styles.statusHeader}>
          <IconBadge name="shield-checkmark-outline" tone="neutral" size={18} />

          <View style={styles.statusText}>
            <AppText variant="caption" color={colors.muted}>
              Последняя заявка
            </AppText>
            <AppText variant="subheading" style={styles.statusValue}>
              {verificationRequestStatusLabel(latestStatus)}
            </AppText>
          </View>
        </View>

        <View style={styles.statusMeta}>
          <View style={styles.metaItem}>
            <AppText variant="caption" color={colors.muted}>
              Метод
            </AppText>
            <AppText>{latestMethod ?? "—"}</AppText>
          </View>

          <View style={styles.metaItem}>
            <AppText variant="caption" color={colors.muted}>
              Тип документа
            </AppText>
            <AppText>{latestDocumentType ?? "—"}</AppText>
          </View>

          <View style={styles.metaItem}>
            <AppText variant="caption" color={colors.muted}>
              Дата
            </AppText>
            <AppText>{formatVerificationDate(latestCreatedAt)}</AppText>
          </View>
        </View>

        {latestReviewComment ? (
          <View style={styles.reviewBox}>
            <AppText variant="caption" color={colors.danger}>
              Комментарий проверки
            </AppText>
            <AppText color={colors.danger} style={styles.reviewText}>
              {latestReviewComment}
            </AppText>
          </View>
        ) : null}

        {latestDocumentUrl ? (
          <AppButton
            title="Открыть текущий PDF"
            icon="open-outline"
            variant="secondary"
            fullWidth
            loading={isOpening}
            disabled={isOpening}
            style={styles.openButton}
            onPress={openLatestDocument}
          />
        ) : null}
      </View>

      {selectedAsset ? (
        <View style={styles.fileBox}>
          <IconBadge name="document-text-outline" tone="neutral" size={18} />

          <View style={styles.fileText}>
            <AppText variant="subheading" numberOfLines={1}>
              {selectedAsset.name}
            </AppText>

            <AppText color={colors.textSoft} style={styles.fileMeta}>
              {selectedAsset.mimeType ?? "application/pdf"} •{" "}
              {formatDocumentSize(selectedAsset.size)}
            </AppText>
          </View>
        </View>
      ) : null}

      {!canSubmitVerification ? (
        <View style={styles.warningBox}>
          <AppText color={colors.warning}>
            Перед отправкой PDF заполни обязательные поля профиля и убедись, что
            email-домен разрешен.
          </AppText>
        </View>
      ) : null}

      {message ? (
        <View style={[styles.messageBox, styles.successBox]}>
          <AppText color={colors.success}>{message}</AppText>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.messageBox, styles.errorBox]}>
          <AppText color={colors.danger}>{error}</AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          title="Выбрать PDF"
          icon="document-outline"
          variant="secondary"
          fullWidth
          disabled={!canSubmitVerification || isUploading}
          onPress={pickDocument}
        />

        <AppButton
          title="Отправить PDF на проверку"
          icon="cloud-upload-outline"
          fullWidth
          loading={isUploading}
          disabled={!canSubmitVerification || isUploading || !selectedAsset}
          onPress={uploadDocument}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  limitBadge: {
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusBox: {
    marginTop: spacing.xl,
    borderRadius: radius["2xl"],
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
  },
  statusHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  statusText: {
    flex: 1,
  },
  statusValue: {
    marginTop: spacing.xs,
  },
  statusMeta: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaItem: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  reviewBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  reviewText: {
    marginTop: spacing.xs,
  },
  openButton: {
    marginTop: spacing.lg,
  },
  fileBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  fileText: {
    flex: 1,
  },
  fileMeta: {
    marginTop: spacing.xs,
  },
  warningBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
  },
  messageBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  successBox: {
    borderColor: colors.successSoft,
    backgroundColor: colors.successSoft,
  },
  errorBox: {
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
