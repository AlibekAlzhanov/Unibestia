import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";

type Tone = "success" | "warning" | "danger" | "primary" | "neutral";

type StaffStatusBadgeProps = {
  label: string;
  tone?: Tone;
};

function toneColors(tone: Tone) {
  switch (tone) {
    case "success":
      return { bg: colors.successSoft, fg: colors.success };
    case "warning":
      return { bg: colors.warningSoft, fg: colors.warning };
    case "danger":
      return { bg: colors.dangerSoft, fg: colors.danger };
    case "primary":
      return { bg: colors.surfaceMuted, fg: colors.primary };
    default:
      return { bg: colors.surfaceMuted, fg: colors.textSoft };
  }
}

export function StaffStatusBadge({
  label,
  tone = "neutral",
}: StaffStatusBadgeProps) {
  const palette = toneColors(tone);

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" color={palette.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
