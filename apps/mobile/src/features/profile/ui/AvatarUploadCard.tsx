import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  AVATAR_MAX_SIZE_BYTES,
  uploadAvatarToBackend,
  validateAvatarAsset,
} from "../lib/avatarUpload";
import { ProfileAvatar } from "./ProfileAvatar";

type AvatarUploadCardProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  onUploaded?: () => Promise<unknown> | unknown;
};

function formatSize(bytes?: number | null): string {
  if (!bytes) {
    return "размер неизвестен";
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function AvatarUploadCard({
  avatarUrl,
  displayName,
  email,
  onUploaded,
}: AvatarUploadCardProps) {
  const { getToken } = useAuth();

  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUri = selectedAsset?.uri ?? null;

  const visibleAvatarUrl = useMemo(
    () => previewUri ?? avatarUrl ?? null,
    [avatarUrl, previewUri]
  );

  async function pickAvatar(): Promise<void> {
    setMessage(null);
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Разреши доступ к галерее, чтобы выбрать аватарку.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
      selectionLimit: 1,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset) {
      setError("Не удалось выбрать изображение.");
      return;
    }

    const validationError = validateAvatarAsset(asset);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedAsset(asset);
  }

  async function uploadAvatar(): Promise<void> {
    if (!selectedAsset) {
      setError("Выбери фото профиля.");
      return;
    }

    const validationError = validateAvatarAsset(selectedAsset);

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

      await uploadAvatarToBackend({
        token,
        asset: selectedAsset,
      });

      setSelectedAsset(null);
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
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="camera-outline" tone="primary" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Аватарка профиля</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Фото будет отображаться в профиле и верхней панели приложения.
          </AppText>
        </View>

        <View style={styles.limitBadge}>
          <AppText variant="caption" color={colors.accent}>
            до {Math.round(AVATAR_MAX_SIZE_BYTES / 1024 / 1024)} MB
          </AppText>
        </View>
      </View>

      <View style={styles.previewBox}>
        <ProfileAvatar
          avatarUrl={visibleAvatarUrl}
          displayName={displayName}
          email={email}
          size={96}
          borderWidth={4}
        />

        <View style={styles.previewText}>
          <AppText variant="subheading" numberOfLines={1}>
            {displayName || email || "Пользователь"}
          </AppText>

          <AppText color={colors.textSoft} numberOfLines={1} style={styles.email}>
            {email || "email не указан"}
          </AppText>

          <AppText variant="caption" color={colors.muted} style={styles.format}>
            JPG, PNG или WEBP
          </AppText>
        </View>
      </View>

      {selectedAsset ? (
        <View style={styles.fileBox}>
          <AppText variant="caption" color={colors.muted}>
            Выбранный файл
          </AppText>
          <AppText style={styles.fileName} numberOfLines={1}>
            {selectedAsset.fileName ?? "avatar"}
          </AppText>
          <AppText color={colors.textSoft} style={styles.fileSize}>
            Размер: {formatSize(selectedAsset.fileSize)}
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
          title="Выбрать фото"
          icon="image-outline"
          variant="secondary"
          fullWidth
          onPress={pickAvatar}
        />

        <AppButton
          title="Загрузить аватарку"
          icon="cloud-upload-outline"
          fullWidth
          loading={isUploading}
          disabled={isUploading || !selectedAsset}
          onPress={uploadAvatar}
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
  previewBox: {
    marginTop: spacing.xl,
    borderRadius: radius["2xl"],
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  previewText: {
    flex: 1,
  },
  email: {
    marginTop: spacing.xs,
  },
  format: {
    marginTop: spacing.md,
  },
  fileBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  fileName: {
    marginTop: spacing.xs,
  },
  fileSize: {
    marginTop: spacing.xs,
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
