import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppIcon, type AppIconName } from "../../../shared/ui/AppIcon";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  canSubmitVerification,
  isAllowedStudentDomain,
  readProfileCompletionPercent,
  readRequiredFields,
  readVerificationStatus,
  verificationStatusLabel,
} from "../lib/profileView";
import {
  formatVerificationDate,
  readLatestVerificationCreatedAt,
  readLatestVerificationStatus,
  verificationRequestStatusLabel,
} from "../lib/verificationDocumentView";

type VerificationStepsCardProps = {
  profile: unknown;
};

type StepTone = "success" | "warning" | "danger" | "neutral";

type Step = {
  key: string;
  title: string;
  description: string;
  complete: boolean;
  tone: StepTone;
  icon: AppIconName;
};

function getToneColors(tone: StepTone) {
  switch (tone) {
    case "success":
      return {
        background: colors.successSoft,
        text: colors.success,
        icon: colors.success,
      };
    case "warning":
      return {
        background: colors.warningSoft,
        text: colors.warning,
        icon: colors.warning,
      };
    case "danger":
      return {
        background: colors.dangerSoft,
        text: colors.danger,
        icon: colors.danger,
      };
    default:
      return {
        background: colors.surfaceMuted,
        text: colors.textSoft,
        icon: colors.muted,
      };
  }
}

function getVerificationSummary(profile: unknown): string {
  const profileStatus = readVerificationStatus(profile);
  const requestStatus = readLatestVerificationStatus(profile);
  const createdAt = readLatestVerificationCreatedAt(profile);

  if (profileStatus === "verified") {
    return "Студенческий статус подтвержден. Можно пользоваться всеми предложениями.";
  }

  if (requestStatus) {
    return `${verificationRequestStatusLabel(requestStatus)}${
      createdAt ? ` · ${formatVerificationDate(createdAt)}` : ""
    }`;
  }

  return verificationStatusLabel(profileStatus);
}

export function VerificationStepsCard({ profile }: VerificationStepsCardProps) {
  const percent = readProfileCompletionPercent(profile);
  const missingFields = readRequiredFields(profile).filter((field) => !field.isComplete);
  const allowedDomain = isAllowedStudentDomain(profile);
  const canSubmit = canSubmitVerification(profile);
  const profileStatus = readVerificationStatus(profile);
  const latestRequestStatus = readLatestVerificationStatus(profile);

  const hasVerificationRequest = Boolean(latestRequestStatus);
  const verified = profileStatus === "verified";
  const rejected = profileStatus === "rejected" || latestRequestStatus === "rejected";
  const pending =
    profileStatus === "pending_review" ||
    latestRequestStatus === "pending" ||
    latestRequestStatus === "pending_review";

  const steps: Step[] = [
    {
      key: "email-domain",
      title: "Студенческий email",
      description: allowedDomain
        ? "Домен email подходит для студенческой верификации."
        : "Нужен email с разрешенным университетским доменом.",
      complete: allowedDomain,
      tone: allowedDomain ? "success" : "danger",
      icon: allowedDomain ? "mail-open-outline" : "mail-outline",
    },
    {
      key: "profile-data",
      title: "Данные профиля",
      description:
        missingFields.length === 0
          ? "Все обязательные поля заполнены."
          : `Осталось заполнить: ${missingFields.map((field) => field.label).join(", ")}.`,
      complete: missingFields.length === 0,
      tone: missingFields.length === 0 ? "success" : "warning",
      icon: missingFields.length === 0 ? "checkmark-circle-outline" : "create-outline",
    },
    {
      key: "document",
      title: "PDF студенческого",
      description: hasVerificationRequest
        ? getVerificationSummary(profile)
        : canSubmit
          ? "Можно отправить PDF электронного студенческого на проверку."
          : "PDF станет доступен после заполнения обязательных данных.",
      complete: hasVerificationRequest || verified,
      tone: verified
        ? "success"
        : rejected
          ? "danger"
          : hasVerificationRequest || canSubmit
            ? "warning"
            : "neutral",
      icon: hasVerificationRequest ? "document-attach-outline" : "document-outline",
    },
    {
      key: "final-status",
      title: "Решение проверки",
      description: verified
        ? "Проверка завершена успешно."
        : rejected
          ? "Проверка отклонена. Посмотри комментарий и отправь документ повторно."
          : pending
            ? "Заявка ожидает решения администратора."
            : "После отправки PDF администратор проверит документ.",
      complete: verified,
      tone: verified ? "success" : rejected ? "danger" : pending ? "warning" : "neutral",
      icon: verified
        ? "shield-checkmark-outline"
        : rejected
          ? "alert-circle-outline"
          : "time-outline",
    },
  ];

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="map-outline" tone="primary" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Путь верификации</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Следи за шагами: данные, PDF и решение администратора.
          </AppText>
        </View>

        <View style={styles.percentBadge}>
          <AppText variant="caption" color={percent >= 100 ? colors.success : colors.primary}>
            {percent}%
          </AppText>
        </View>
      </View>

      <View style={styles.steps}>
        {steps.map((step, index) => {
          const toneColors = getToneColors(step.tone);

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: toneColors.background,
                    },
                  ]}
                >
                  <AppIcon name={step.icon} size={17} color={toneColors.icon} />
                </View>

                {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>

              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <AppText variant="subheading" style={styles.stepTitle}>
                    {step.title}
                  </AppText>

                  <View style={[styles.statusBadge, { backgroundColor: toneColors.background }]}>
                    <AppText variant="caption" color={toneColors.text}>
                      {step.complete ? "готово" : "ожидает"}
                    </AppText>
                  </View>
                </View>

                <AppText color={colors.textSoft} style={styles.stepDescription}>
                  {step.description}
                </AppText>
              </View>
            </View>
          );
        })}
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
  percentBadge: {
    minWidth: 52,
    minHeight: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  steps: {
    marginTop: spacing.xl,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stepRail: {
    alignItems: "center",
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 44,
    backgroundColor: colors.border,
  },
  stepContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  stepTitle: {
    flex: 1,
  },
  statusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  stepDescription: {
    marginTop: spacing.xs,
  },
});
