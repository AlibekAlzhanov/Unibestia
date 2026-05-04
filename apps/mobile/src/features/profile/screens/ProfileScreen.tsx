import { useCallback } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { StyleSheet, View } from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  readAvatarUrl,
  readProfileDisplayName,
  readProfileEmail,
} from "../lib/avatarView";
import { useMyProfile } from "../api/useMyProfile";
import {
  degreeLabel,
  isAllowedStudentDomain,
  readDegree,
  readPhone,
  readSpecialty,
  readUniversityName,
  readVerificationReviewComment,
  readVerificationStatus,
  verificationStatusLabel,
} from "../lib/profileView";
import { AvatarUploadCard } from "../ui/AvatarUploadCard";
import { ProfileAvatar } from "../ui/ProfileAvatar";
import { ProfileCompletionCard } from "../ui/ProfileCompletionCard";
import { StatusBadge } from "../ui/StatusBadge";

type Props = NativeStackScreenProps<StudentStackParamList, "Profile">;

function statusTone(status: string) {
  if (status === "verified") {
    return "success" as const;
  }

  if (status === "pending_review") {
    return "warning" as const;
  }

  if (status === "rejected" || status === "expired") {
    return "danger" as const;
  }

  return "neutral" as const;
}

export function ProfileScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const profileQuery = useMyProfile();
  const profile = profileQuery.data;

  const refreshHandler = useCallback(async () => {
    await profileQuery.refetch();
  }, [profileQuery]);

  const refresh = useRefresh(refreshHandler);

  const status = readVerificationStatus(profile);
  const avatarUrl = readAvatarUrl(profile);
  const displayName = readProfileDisplayName(profile);
  const email = readProfileEmail(profile);

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="person-circle-outline"
        title="Профиль"
        subtitle="Статус студента, аватарка и настройки аккаунта."
      />

      {profileQuery.isLoading ? (
        <StateView title="Загружаем профиль" loading />
      ) : profileQuery.error ? (
        <ErrorStateView
          error={profileQuery.error}
          fallbackTitle="Не удалось загрузить профиль"
          onRetry={() => profileQuery.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <AppCard>
            <View style={styles.profileHeader}>
              <ProfileAvatar
                avatarUrl={avatarUrl}
                displayName={displayName}
                email={email}
                size={68}
                borderWidth={3}
              />

              <View style={styles.profileTitle}>
                <AppText variant="subheading">{displayName}</AppText>
                <AppText color={colors.textSoft} style={styles.email}>
                  {email}
                </AppText>
              </View>
            </View>

            <View style={styles.badges}>
              <StatusBadge
                label={verificationStatusLabel(status)}
                tone={statusTone(status)}
              />

              <StatusBadge
                label={
                  isAllowedStudentDomain(profile)
                    ? "Домен разрешен"
                    : "Домен не разрешен"
                }
                tone={isAllowedStudentDomain(profile) ? "success" : "danger"}
              />
            </View>
          </AppCard>

          <AvatarUploadCard
            avatarUrl={avatarUrl}
            displayName={displayName}
            email={email}
            onUploaded={() => profileQuery.refetch()}
          />

          <AppCard>
            <View style={styles.cardHeader}>
              <IconBadge name="school-outline" tone="neutral" />
              <View style={styles.cardHeaderText}>
                <AppText variant="caption" color={colors.muted}>
                  UNIVERSITY
                </AppText>
                <AppText variant="subheading" style={styles.cardTitle}>
                  {readUniversityName(profile)}
                </AppText>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <AppText variant="caption" color={colors.muted}>
                  Степень
                </AppText>
                <AppText style={styles.infoValue}>
                  {degreeLabel(readDegree(profile))}
                </AppText>
              </View>

              <View style={styles.infoBox}>
                <AppText variant="caption" color={colors.muted}>
                  Специальность
                </AppText>
                <AppText style={styles.infoValue}>
                  {readSpecialty(profile) || "Не указано"}
                </AppText>
              </View>

              <View style={styles.infoBox}>
                <AppText variant="caption" color={colors.muted}>
                  Телефон
                </AppText>
                <AppText style={styles.infoValue}>
                  {readPhone(profile) || "Не указан"}
                </AppText>
              </View>
            </View>
          </AppCard>

          <ProfileCompletionCard profile={profile} />

          {readVerificationReviewComment(profile) ? (
            <AppCard>
              <View style={styles.cardHeader}>
                <IconBadge name="alert-circle-outline" tone="danger" />
                <View style={styles.cardHeaderText}>
                  <AppText variant="caption" color={colors.danger}>
                    Комментарий проверки
                  </AppText>
                  <AppText style={styles.reviewComment}>
                    {readVerificationReviewComment(profile)}
                  </AppText>
                </View>
              </View>
            </AppCard>
          ) : null}

          <AppButton
            title="Заполнить / обновить профиль"
            icon="create-outline"
            fullWidth
            onPress={() => navigation.navigate("Verification")}
          />

          <AppButton
            title="Выйти"
            icon="log-out-outline"
            variant="danger"
            fullWidth
            onPress={() => signOut()}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  profileHeader: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  profileTitle: {
    flex: 1,
  },
  email: {
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    marginTop: spacing.xs,
  },
  infoGrid: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  infoBox: {
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  infoValue: {
    marginTop: spacing.xs,
  },
  reviewComment: {
    marginTop: spacing.sm,
  },
});
