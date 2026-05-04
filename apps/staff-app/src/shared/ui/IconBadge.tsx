import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { AppIcon, type AppIconName } from "./AppIcon";

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "neutral";

type IconBadgeProps = {
  name: AppIconName;
  tone?: Tone;
  size?: number;
};

function getTone(tone: Tone) {
  switch (tone) {
    case "accent":
      return { bg: colors.accentSoft, fg: colors.accent };
    case "success":
      return { bg: colors.successSoft, fg: colors.success };
    case "warning":
      return { bg: colors.warningSoft, fg: colors.warning };
    case "danger":
      return { bg: colors.dangerSoft, fg: colors.danger };
    case "neutral":
      return { bg: colors.surfaceMuted, fg: colors.muted };
    default:
      return { bg: colors.surfaceMuted, fg: colors.primary };
  }
}

export function IconBadge({ name, tone = "primary", size = 22 }: IconBadgeProps) {
  const palette = getTone(tone);

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <AppIcon name={name} size={size} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
