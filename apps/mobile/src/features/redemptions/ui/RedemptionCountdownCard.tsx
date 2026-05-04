import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatRedemptionDate,
  formatRemainingTime,
  getRemainingMs,
  readRedemptionCreatedAt,
  readRedemptionExpiresAt,
  readRedemptionUsedAt,
} from "../lib/redemptionLifecycleView";

type RedemptionCountdownCardProps = {
  redemption: unknown;
};

export function RedemptionCountdownCard({ redemption }: RedemptionCountdownCardProps) {
  const expiresAt = readRedemptionExpiresAt(redemption);
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiresAt));

  useEffect(() => {
    setRemainingMs(getRemainingMs(expiresAt));

    const intervalId = setInterval(() => {
      setRemainingMs(getRemainingMs(expiresAt));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [expiresAt]);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="timer-outline" tone="primary" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Срок действия QR</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Покажи QR сотруднику партнера до завершения срока.
          </AppText>
        </View>
      </View>

      <View style={styles.timerBox}>
        <AppText variant="heading" color={remainingMs === 0 ? colors.danger : colors.primary}>
          {formatRemainingTime(remainingMs)}
        </AppText>

        <AppText variant="caption" color={colors.muted} style={styles.timerSubtitle}>
          осталось
        </AppText>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <AppText variant="caption" color={colors.muted}>
            Создан
          </AppText>
          <AppText style={styles.metaValue}>
            {formatRedemptionDate(readRedemptionCreatedAt(redemption))}
          </AppText>
        </View>

        <View style={styles.metaItem}>
          <AppText variant="caption" color={colors.muted}>
            Истекает
          </AppText>
          <AppText style={styles.metaValue}>
            {formatRedemptionDate(expiresAt)}
          </AppText>
        </View>

        {readRedemptionUsedAt(redemption) ? (
          <View style={styles.metaItem}>
            <AppText variant="caption" color={colors.muted}>
              Использован
            </AppText>
            <AppText style={styles.metaValue}>
              {formatRedemptionDate(readRedemptionUsedAt(redemption))}
            </AppText>
          </View>
        ) : null}
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
  timerBox: {
    marginTop: spacing.xl,
    borderRadius: radius["2xl"],
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  timerSubtitle: {
    marginTop: spacing.xs,
  },
  metaGrid: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  metaItem: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  metaValue: {
    marginTop: spacing.xs,
  },
});
