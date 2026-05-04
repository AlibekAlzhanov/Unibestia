import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppIcon, type AppIconName } from "../../../shared/ui/AppIcon";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  canShowRedemptionQr,
  formatRedemptionDate,
  isRedemptionCancelled,
  isRedemptionExpired,
  isRedemptionUsed,
  readRedemptionCode,
  readRedemptionExpiresAt,
  readRedemptionQrPayload,
  redemptionStatusLabel,
} from "../lib/redemptionLifecycleView";
import { QRCodePanel } from "./QRCodePanel";

type RedemptionQrAccessPanelProps = {
  redemption: unknown;
  fallbackRedemptionId: string;
  onOpenOffer?: () => void;
  onRefresh?: () => void;
};

function getFinalState(redemption: unknown): {
  icon: AppIconName;
  title: string;
  description: string;
  tone: "success" | "danger" | "neutral";
} {
  if (isRedemptionUsed(redemption)) {
    return {
      icon: "checkmark-circle-outline",
      title: "QR уже использован",
      description:
        "Сотрудник партнера подтвердил этот код. Повторно использовать его нельзя.",
      tone: "success",
    };
  }

  if (isRedemptionExpired(redemption)) {
    return {
      icon: "time-outline",
      title: "Срок QR истек",
      description:
        "Этот QR-код больше нельзя показать партнеру. Открой скидку и создай новый код, если предложение ещё доступно.",
      tone: "danger",
    };
  }

  if (isRedemptionCancelled(redemption)) {
    return {
      icon: "close-circle-outline",
      title: "QR отменен",
      description:
        "Этот QR-код отменен и не может быть активирован партнером.",
      tone: "danger",
    };
  }

  return {
    icon: "qr-code-outline",
    title: "QR недоступен",
    description: "Обнови экран или попробуй открыть QR позже.",
    tone: "neutral",
  };
}

function getToneColors(tone: "success" | "danger" | "neutral") {
  if (tone === "success") {
    return {
      background: colors.successSoft,
      text: colors.success,
    };
  }

  if (tone === "danger") {
    return {
      background: colors.dangerSoft,
      text: colors.danger,
    };
  }

  return {
    background: colors.surfaceMuted,
    text: colors.textSoft,
  };
}

export function RedemptionQrAccessPanel({
  redemption,
  fallbackRedemptionId,
  onOpenOffer,
  onRefresh,
}: RedemptionQrAccessPanelProps) {
  const qrToken =
    readRedemptionQrPayload(redemption) ||
    readRedemptionCode(redemption) ||
    fallbackRedemptionId;

  if (canShowRedemptionQr(redemption)) {
    return (
      <View style={styles.stack}>
        <QRCodePanel
          qrToken={qrToken}
          status={redemptionStatusLabel(redemption)}
          expiresAt={formatRedemptionDate(readRedemptionExpiresAt(redemption))}
        />

        <AppCard>
          <View style={styles.safetyHeader}>
            <IconBadge name="shield-checkmark-outline" tone="warning" />

            <View style={styles.safetyText}>
              <AppText variant="subheading">Безопасность QR</AppText>
              <AppText color={colors.textSoft} style={styles.description}>
                QR привязан к твоему аккаунту. Не отправляй его другим людям и
                показывай только сотруднику партнера.
              </AppText>
            </View>
          </View>

          <View style={styles.rules}>
            <View style={styles.ruleRow}>
              <AppIcon name="eye-off-outline" size={18} color={colors.warning} />
              <AppText color={colors.textSoft} style={styles.ruleText}>
                Не публикуй QR в чатах и социальных сетях.
              </AppText>
            </View>

            <View style={styles.ruleRow}>
              <AppIcon name="person-outline" size={18} color={colors.warning} />
              <AppText color={colors.textSoft} style={styles.ruleText}>
                Партнер может попросить подтвердить, что аккаунт принадлежит тебе.
              </AppText>
            </View>
          </View>
        </AppCard>
      </View>
    );
  }

  const finalState = getFinalState(redemption);
  const toneColors = getToneColors(finalState.tone);

  return (
    <AppCard>
      <View style={[styles.finalIcon, { backgroundColor: toneColors.background }]}>
        <AppIcon name={finalState.icon} size={42} color={toneColors.text} />
      </View>

      <AppText variant="heading" style={styles.finalTitle}>
        {finalState.title}
      </AppText>

      <AppText color={colors.textSoft} style={styles.finalDescription}>
        {finalState.description}
      </AppText>

      <View style={styles.finalStatus}>
        <AppText variant="caption" color={colors.muted}>
          Статус
        </AppText>
        <AppText variant="caption" color={toneColors.text}>
          {redemptionStatusLabel(redemption)}
        </AppText>
      </View>

      <View style={styles.actions}>
        {onRefresh ? (
          <AppButton
            title="Обновить статус"
            icon="refresh-outline"
            variant="secondary"
            fullWidth
            onPress={onRefresh}
          />
        ) : null}

        {onOpenOffer && isRedemptionExpired(redemption) ? (
          <AppButton
            title="Открыть скидку"
            icon="pricetag-outline"
            fullWidth
            onPress={onOpenOffer}
          />
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  safetyHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  safetyText: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xs,
  },
  rules: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  ruleRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  ruleText: {
    flex: 1,
  },
  finalIcon: {
    width: 82,
    height: 82,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  finalTitle: {
    marginTop: spacing.xl,
    textAlign: "center",
  },
  finalDescription: {
    marginTop: spacing.md,
    textAlign: "center",
  },
  finalStatus: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
