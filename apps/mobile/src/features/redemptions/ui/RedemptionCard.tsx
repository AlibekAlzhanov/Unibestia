import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatRedemptionDate,
  getStatusLabel,
  isFinalRedemptionStatus,
  readCreatedAt,
  readExpiresAt,
  readOfferTitle,
  readPartnerName,
  readRedemptionStatus,
} from "../lib/redemptionView";

type RedemptionCardProps = {
  redemption: unknown;
  onPress?: () => void;
};

export function RedemptionCard({ redemption, onPress }: RedemptionCardProps) {
  const status = readRedemptionStatus(redemption);
  const isFinal = isFinalRedemptionStatus(status);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        <IconBadge
          name={isFinal ? "checkmark-done-outline" : "qr-code-outline"}
          tone={isFinal ? "neutral" : "success"}
        />

        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.titleColumn}>
              <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                {readPartnerName(redemption)}
              </AppText>
              <AppText variant="subheading" style={styles.title} numberOfLines={2}>
                {readOfferTitle(redemption)}
              </AppText>
            </View>

            <View
              style={[
                styles.statusBadge,
                isFinal ? styles.statusFinal : styles.statusActive,
              ]}
            >
              <AppText
                variant="caption"
                color={isFinal ? colors.textSoft : colors.success}
              >
                {getStatusLabel(status)}
              </AppText>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <AppText variant="caption" color={colors.muted}>
                Создан
              </AppText>
              <AppText variant="caption">
                {formatRedemptionDate(readCreatedAt(redemption))}
              </AppText>
            </View>

            <View style={styles.footerRight}>
              <AppText variant="caption" color={colors.muted}>
                До
              </AppText>
              <AppText variant="caption">
                {formatRedemptionDate(readExpiresAt(redemption))}
              </AppText>
            </View>
          </View>
        </View>

        <AppIcon name="chevron-forward" size={18} color={colors.muted} />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.86,
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
  title: {
    marginTop: spacing.xs,
  },
  statusBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusActive: {
    backgroundColor: colors.successSoft,
  },
  statusFinal: {
    backgroundColor: colors.surfaceMuted,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerRight: {
    alignItems: "flex-end",
  },
});
