import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { AppIcon, type AppIconName } from "./AppIcon";

type IconBadgeTone = "primary" | "accent" | "success" | "warning" | "danger" | "neutral";

type IconBadgeProps = {
  name: AppIconName;
  tone?: IconBadgeTone;
  size?: number;
  style?: ViewStyle;
};

function getTone(tone: IconBadgeTone) {
  switch (tone) {
    case "primary":
      return {
        backgroundColor: colors.primary,
        color: colors.white,
      };
    case "accent":
      return {
        backgroundColor: colors.accentSoft,
        color: colors.accent,
      };
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

export function IconBadge({
  name,
  tone = "neutral",
  size = 22,
  style,
}: IconBadgeProps) {
  const toneStyle = getTone(tone);

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }, style]}>
      <AppIcon name={name} size={size} color={toneStyle.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
