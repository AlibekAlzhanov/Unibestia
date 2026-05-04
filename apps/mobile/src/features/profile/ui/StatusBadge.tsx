import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

function getStyle(tone: StatusBadgeTone) {
  switch (tone) {
    case "success":
      return {
        backgroundColor: colors.successSoft,
        color: colors.success,
      };
    case "warning":
      return {
        backgroundColor: colors.warningSoft,
        color: colors.warning,
      };
    case "danger":
      return {
        backgroundColor: colors.dangerSoft,
        color: colors.danger,
      };
    default:
      return {
        backgroundColor: colors.surfaceMuted,
        color: colors.textSoft,
      };
  }
}

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const toneStyle = getStyle(tone);

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }]}>
      <AppText variant="caption" color={toneStyle.color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
