import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import {
  redemptionStatusLabel,
  redemptionStatusTone,
} from "../lib/redemptionLifecycleView";

type RedemptionStatusPillProps = {
  redemption: unknown;
};

function toneColors(tone: ReturnType<typeof redemptionStatusTone>) {
  switch (tone) {
    case "success":
      return {
        bg: colors.successSoft,
        text: colors.success,
        icon: "checkmark-circle-outline" as const,
      };
    case "warning":
      return {
        bg: colors.warningSoft,
        text: colors.warning,
        icon: "time-outline" as const,
      };
    case "danger":
      return {
        bg: colors.dangerSoft,
        text: colors.danger,
        icon: "alert-circle-outline" as const,
      };
    case "primary":
      return {
        bg: colors.accentSoft,
        text: colors.primary,
        icon: "qr-code-outline" as const,
      };
    default:
      return {
        bg: colors.surfaceMuted,
        text: colors.textSoft,
        icon: "ellipse-outline" as const,
      };
  }
}

export function RedemptionStatusPill({ redemption }: RedemptionStatusPillProps) {
  const tone = redemptionStatusTone(redemption);
  const current = toneColors(tone);

  return (
    <View style={[styles.pill, { backgroundColor: current.bg }]}>
      <AppIcon name={current.icon} size={16} color={current.text} />
      <AppText variant="caption" color={current.text}>
        {redemptionStatusLabel(redemption)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 36,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
