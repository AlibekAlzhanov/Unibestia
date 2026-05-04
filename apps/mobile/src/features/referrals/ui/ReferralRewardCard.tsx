import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatReferralDate,
  readRewardCreatedAt,
  readRewardPoints,
  readRewardStatus,
  readRewardUserName,
  referralStatusLabel,
} from "../lib/referralView";

type ReferralRewardCardProps = {
  reward: unknown;
};

export function ReferralRewardCard({ reward }: ReferralRewardCardProps) {
  const status = readRewardStatus(reward);
  const rewarded = status.toLowerCase() === "rewarded";

  return (
    <AppCard style={styles.card}>
      <IconBadge
        name={rewarded ? "checkmark-circle-outline" : "time-outline"}
        tone={rewarded ? "success" : "warning"}
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.titleColumn}>
            <AppText variant="subheading" numberOfLines={1}>
              {readRewardUserName(reward)}
            </AppText>
            <AppText variant="caption" color={colors.muted} style={styles.meta}>
              {formatReferralDate(readRewardCreatedAt(reward))}
            </AppText>
          </View>

          <View style={[styles.badge, rewarded ? styles.rewarded : styles.pending]}>
            <AppText
              variant="caption"
              color={rewarded ? colors.success : colors.warning}
            >
              {referralStatusLabel(status)}
            </AppText>
          </View>
        </View>

        <AppText color={colors.textSoft} style={styles.points}>
          Бонусы: {readRewardPoints(reward)}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleColumn: {
    flex: 1,
  },
  meta: {
    marginTop: spacing.xs,
  },
  badge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rewarded: {
    backgroundColor: colors.successSoft,
  },
  pending: {
    backgroundColor: colors.warningSoft,
  },
  points: {
    marginTop: spacing.md,
  },
});
